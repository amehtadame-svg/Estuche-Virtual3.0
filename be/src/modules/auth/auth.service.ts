import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { HttpError, badRequest, unauthorized } from '../../lib/errors';

const MAX_ATTEMPTS = Number(process.env.LOGIN_MAX_INTENTOS ?? 5);
const LOCK_MINUTES = Number(process.env.LOGIN_BLOQUEO_MINUTOS ?? 15);

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
    // la bitácora nunca debe interrumpir la autenticación
  }
}

function signToken(user: AuthUser) {
  return jwt.sign(
    { id: user.id, name: user.fullName, email: user.email, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: '8h' }
  );
}

function publicUser(user: AuthUser) {
  return { id: user.id, name: user.fullName, email: user.email, role: user.role };
}

export const authService = {
  async login({ email, password }: { email: string; password: string }, ctx: RequestContext) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      await logSecurityEvent(null, 'login_fail', false, ctx, { email, reason: 'user_not_found' });
      throw unauthorized('Credenciales inválidas');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await logSecurityEvent(user.id, 'login_blocked', false, ctx);
      throw new HttpError(
        423,
        `Cuenta bloqueada temporalmente. Intenta después de ${user.lockedUntil.toLocaleTimeString()}.`
      );
    }

    const valid = await bcrypt.compare(password, user.hashedPassword);
    if (!valid) {
      const attempts = user.failedAttempts + 1;
      const shouldLock = attempts >= MAX_ATTEMPTS;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedAttempts: attempts,
          lockedUntil: shouldLock ? new Date(Date.now() + LOCK_MINUTES * 60_000) : user.lockedUntil,
        },
      });
      await logSecurityEvent(user.id, 'login_fail', false, ctx, { attempts, shouldLock });
      throw unauthorized('Credenciales inválidas');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lockedUntil: null, lastLogin: new Date() },
    });
    await logSecurityEvent(user.id, 'login_ok', true, ctx);

    return { token: signToken(user), user: publicUser(user) };
  },

  async register({ name, email, password }: { name: string; email: string; password: string }, ctx: RequestContext) {
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
    return { token: signToken(newUser), user: publicUser(newUser) };
  },

  async resetPassword({ email, newPassword }: { email: string; newPassword: string }, ctx: RequestContext) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new HttpError(404, 'Usuario no encontrado');

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email },
      data: {
        hashedPassword: hashed,
        passwordUpdatedAt: new Date(),
        failedAttempts: 0,
        lockedUntil: null,
      },
    });

    await logSecurityEvent(user.id, 'password_reset', true, ctx);
    return { message: 'Contraseña actualizada correctamente' };
  },
};
