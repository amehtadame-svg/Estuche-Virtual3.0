import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { HttpError, badRequest, unauthorized, locked, tooManyRequests } from '../../lib/errors';
import { MAX_ATTEMPTS, LOCK_MINUTES } from '../../utils/auth.utils';
import { sendVerificationCode } from '../../lib/mailer';
import {
  createResetCode,
  verifyResetCode,
  consumeResetCode,
  clearResetCode,
  secondsUntilResend,
} from '../../lib/tokenStore';

export interface RequestContext {
  ip: string | null;
  userAgent: string | null;
}

interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

async function logSecurityEvent(
  userId: string | null,
  type: string,
  success: boolean,
  ctx: RequestContext,
  detail?: unknown
) {
  try {
    await prisma.securityEvent.create({
      data: {
        userId,
        type,
        success,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        detail: (detail as any) ?? undefined,
      },
    });
  } catch {
  }
}

function signToken(user: AuthUser) {
  const secret = process.env.JWT_SECRET ?? process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error('Falta JWT_SECRET (o JWT_ACCESS_SECRET) en las variables de entorno.');
  }
  return jwt.sign(
    { id: user.id, name: user.fullName, email: user.email, role: user.role },
    secret,
    { expiresIn: '8h' }
  );
}

function publicUser(user: AuthUser) {
  return { id: user.id, name: user.fullName, email: user.email, role: user.role };
}

export const authService = {
  async login({ email, password }: { email: string; password: string }, ctx: RequestContext) {
    const user = await prisma.user.findUnique({ where: { email } });

    // Usuario inexistente: mensaje genérico para no revelar qué correos existen.
    if (!user) {
      await logSecurityEvent(null, 'login_fail', false, ctx, { email, reason: 'user_not_found' });
      throw unauthorized('Correo o contraseña incorrectos.');
    }

    // ¿Cuenta bloqueada todavía?
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await logSecurityEvent(user.id, 'login_blocked', false, ctx);
      throw locked(
        'Tu cuenta está bloqueada temporalmente por demasiados intentos fallidos. ' +
          'Recupera el acceso con el código que enviaremos a tu correo.',
        { locked: true, lockedUntil: user.lockedUntil.toISOString() }
      );
    }

    const valid = await bcrypt.compare(password, user.hashedPassword);

    if (!valid) {
      const attempts = user.failedAttempts + 1;
      const shouldLock = attempts >= MAX_ATTEMPTS;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedAttempts: shouldLock ? 0 : attempts,
          lockedUntil: shouldLock ? new Date(Date.now() + LOCK_MINUTES * 60_000) : user.lockedUntil,
        },
      });
      await logSecurityEvent(user.id, 'login_fail', false, ctx, { attempts, shouldLock });

      if (shouldLock) {
        throw locked(
          `Cuenta bloqueada tras ${MAX_ATTEMPTS} intentos fallidos. ` +
            'Te enviaremos un código a tu correo para restablecer la contraseña.',
          { locked: true }
        );
      }

      throw unauthorized('Correo o contraseña incorrectos.', {
        locked: false,
        remainingAttempts: MAX_ATTEMPTS - attempts,
      });
    }

    // Cuenta desactivada o eliminada lógicamente.
    if (!user.isActive || user.deletedAt) {
      await logSecurityEvent(user.id, 'login_blocked', false, ctx, { reason: 'inactive' });
      throw new HttpError(403, 'Tu cuenta está desactivada. Contacta al administrador.');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lockedUntil: null, lastLogin: new Date() },
    });
    await logSecurityEvent(user.id, 'login_ok', true, ctx);

    return { ok: true, token: signToken(user), user: publicUser(user) };
  },

  async register(
    { name, email, password }: { name: string; email: string; password: string },
    ctx: RequestContext
  ) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw badRequest('El correo ya está registrado');

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        email,
        fullName: name,
        hashedPassword: hashed,
        role: 'client',
        passwordUpdatedAt: new Date(),
        dataConsentAt: new Date(),
      },
    });

    await logSecurityEvent(newUser.id, 'register', true, ctx);
    return { ok: true, token: signToken(newUser), user: publicUser(newUser) };
  },

  async forgotPassword({ email }: { email: string }, ctx: RequestContext) {
    const genericResponse = {
      ok: true,
      message: 'Si el correo está registrado, recibirás un código en unos segundos.',
    };

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt) {
      await logSecurityEvent(null, 'password_reset_request', false, ctx, {
        email,
        reason: 'user_not_found',
      });
      return genericResponse;
    }

    // Anti-spam: no permitir pedir códigos en ráfaga.
    const wait = secondsUntilResend(email);
    if (wait > 0) {
      throw tooManyRequests(
        `Ya enviamos un código hace poco. Espera ${wait} segundo(s) antes de pedir otro.`,
        { retryAfterSeconds: wait }
      );
    }

    const { code, expiresInMinutes } = createResetCode(email);
    const result = await sendVerificationCode(email, code, expiresInMinutes);

    if (!result.sent) {
      // Si el correo no salió, el código no sirve de nada: lo invalidamos.
      clearResetCode(email);
      await logSecurityEvent(user.id, 'password_reset_request', false, ctx, { error: result.error });
      throw new HttpError(
        502,
        'No pudimos enviar el correo en este momento. Inténtalo de nuevo en unos minutos.'
      );
    }

    await logSecurityEvent(user.id, 'password_reset_request', true, ctx);

    return {
      ...genericResponse,
      // Solo en modo prueba (Ethereal): enlace para ver el correo.
      ...(result.previewUrl ? { previewUrl: result.previewUrl } : {}),
    };
  },

  /** PASO 2 — Validar el código sin gastarlo. */
  async verifyResetToken({ email, token }: { email: string; token: string }) {
    const { valid, reason } = verifyResetCode(email, token);
    if (!valid) throw badRequest(reason ?? 'Código inválido.');
    return { ok: true, message: 'Código verificado correctamente.' };
  },

  /** PASO 3 — Cambiar la contraseña consumiendo el código. */
  async resetPassword(
    { email, token, newPassword }: { email: string; token: string; newPassword: string },
    ctx: RequestContext
  ) {
    const { valid, reason } = consumeResetCode(email, token);
    if (!valid) {
      await logSecurityEvent(null, 'password_reset', false, ctx, { email, reason });
      throw badRequest(reason ?? 'Código inválido.');
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new HttpError(404, 'Usuario no encontrado');

    // No permitir reutilizar la contraseña anterior.
    const sameAsBefore = await bcrypt.compare(newPassword, user.hashedPassword);
    if (sameAsBefore) {
      throw badRequest('La nueva contraseña no puede ser igual a la anterior.');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email },
      data: {
        hashedPassword: hashed,
        passwordUpdatedAt: new Date(),
        mustChangePassword: false,
        failedAttempts: 0,
        lockedUntil: null, // cambiar la contraseña desbloquea la cuenta
      },
    });

    await logSecurityEvent(user.id, 'password_reset', true, ctx);
    return { ok: true, message: 'Contraseña actualizada correctamente' };
  },
};
