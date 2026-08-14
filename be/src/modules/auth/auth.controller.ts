import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { validarPassword } from '../../lib/validarPassword';
import { crearToken, verificarYConsumirToken, verificarToken } from '../../lib/tokenStore';
import { enviarCodigoVerificacion } from '../../lib/mailer';
import * as dotenv from 'dotenv';
dotenv.config();

const MAX_INTENTOS = 3; // cuántos errores se permiten antes de bloquear

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validación básica: si faltan datos, avisamos claro en vez de
    // dejar que Prisma reviente más adelante.
    if (!email || !password) {
      return res.status(400).json({ message: 'Correo y contraseña son obligatorios.' });
    }

    const user = await prisma.usuarios.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

    // Si la cuenta ya está bloqueada, ni siquiera revisamos la contraseña.
    if (user.bloqueado) {
      return res.status(403).json({
        message: 'Tu cuenta está bloqueada por intentos fallidos. Verifica tu correo con un código para desbloquearla.',
        locked: true,
      });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      const intentos = user.intentos_fallidos + 1;

      // Si con este error llegamos al máximo permitido, bloqueamos la cuenta.
      if (intentos >= MAX_INTENTOS) {
        await prisma.usuarios.update({
          where: { email },
          data: { intentos_fallidos: intentos, bloqueado: true },
        });
        return res.status(403).json({
          message: 'Has fallado 3 veces. Tu cuenta fue bloqueada; verifica tu correo con un código para desbloquearla.',
          locked: true,
        });
      }

      await prisma.usuarios.update({
        where: { email },
        data: { intentos_fallidos: intentos },
      });

      return res.status(401).json({
        message: 'Credenciales inválidas',
        intentosRestantes: MAX_INTENTOS - intentos,
      });
    }

    // Contraseña correcta: si venía con errores previos, los reiniciamos.
    if (user.intentos_fallidos > 0) {
      await prisma.usuarios.update({ where: { email }, data: { intentos_fallidos: 0 } });
    }

    const token = jwt.sign(
      { id: user.id_usuario, name: user.nombre, email: user.email, role: user.rol },
      process.env.JWT_SECRET as string,
      { expiresIn: '8h' }
    );

    return res.json({
      token,
      user: { id: user.id_usuario, name: user.nombre, email: user.email, role: user.rol }
    });
  } catch (err) {
    // Cualquier error inesperado que no previmos: lo registramos en la
    // consola del servidor (para que TÚ lo veas y lo puedas arreglar),
    // pero respondemos con un error normal en vez de dejar que crashee.
    console.error('Error en login:', err);
    return res.status(500).json({ message: 'Ocurrió un error inesperado. Intenta de nuevo.' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nombre, correo y contraseña son obligatorios.' });
    }

    const passCheck = validarPassword(password);
    if (!passCheck.valid) {
      return res.status(400).json({ message: passCheck.message });
    }

    const existe = await prisma.usuarios.findUnique({ where: { email } });
    if (existe) return res.status(400).json({ message: 'El correo ya está registrado' });

    const hashed = await bcrypt.hash(password, 10);

    const newUser = await prisma.usuarios.create({
      data: { nombre: name, email, password: hashed, rol: 'cliente' }
    });

    const token = jwt.sign(
      { id: newUser.id_usuario, name: newUser.nombre, email: newUser.email, role: newUser.rol },
      process.env.JWT_SECRET as string,
      { expiresIn: '8h' }
    );

    return res.status(201).json({
      token,
      user: { id: newUser.id_usuario, name: newUser.nombre, email: newUser.email, role: newUser.rol }
    });
  } catch (err) {
    console.error('Error en register:', err);
    return res.status(500).json({ message: 'Ocurrió un error inesperado. Intenta de nuevo.' });
  }
};

// Genera un código de 6 dígitos, lo guarda en memoria y lo envía por correo.
// Se usa tanto para "olvidé mi contraseña" como para desbloquear una cuenta.
export const requestToken = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Esta validación es justo la que nos faltaba: si el correo no viene
    // (por ejemplo, una petición mal formada), avisamos claro en vez de
    // dejar que Prisma reciba "email: undefined" y explote.
    if (!email) {
      return res.status(400).json({ message: 'El correo es obligatorio.' });
    }

    const user = await prisma.usuarios.findUnique({ where: { email } });

    // Por seguridad, respondemos igual exista o no el correo (no revelamos
    // si un email está registrado o no).
    if (!user) {
      return res.json({ message: 'Si el correo está registrado, se generó un código.' });
    }

    const token = crearToken(email);
    await enviarCodigoVerificacion(email, token);

    return res.json({ message: 'Código generado y enviado por correo.' });
  } catch (err) {
    console.error('Error en requestToken:', err);
    return res.status(500).json({ message: 'Ocurrió un error inesperado. Intenta de nuevo.' });
  }
};

export const verifyResetToken = async (req: Request, res: Response) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({ message: 'Correo y código son obligatorios.' });
    }

    const { valido, motivo } = verificarToken(email, token);
    if (!valido) {
      return res.status(400).json({ message: motivo });
    }

    return res.json({ message: 'Código válido.' });
  } catch (err) {
    console.error('Error en verifyResetToken:', err);
    return res.status(500).json({ message: 'Ocurrió un error inesperado. Intenta de nuevo.' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({ message: 'Correo, código y nueva contraseña son obligatorios.' });
    }

    const passCheck = validarPassword(newPassword);
    if (!passCheck.valid) {
      return res.status(400).json({ message: passCheck.message });
    }

    const { valido, motivo } = verificarYConsumirToken(email, token);
    if (!valido) {
      return res.status(400).json({ message: motivo });
    }

    const user = await prisma.usuarios.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.usuarios.update({
      where: { email },
      // Al cambiar la contraseña también desbloqueamos la cuenta y
      // reiniciamos el contador de intentos fallidos.
      data: { password: hashed, intentos_fallidos: 0, bloqueado: false },
    });

    return res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('Error en resetPassword:', err);
    return res.status(500).json({ message: 'Ocurrió un error inesperado. Intenta de nuevo.' });
  }
};

export const getMe = (req: Request, res: Response) => {
  return res.json((req as any).user);
};