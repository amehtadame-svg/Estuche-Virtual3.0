import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import * as dotenv from 'dotenv';
import { MAX_INTENTOS, TOKEN_EXP_MINUTOS, generarCodigo, validarPassword } from '../../utils/auth.utils';
dotenv.config();

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.usuarios.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

  // NUEVO: si ya está bloqueada, ni revisamos la contraseña
  if (user.bloqueado) {
    return res.status(403).json({
      message: 'Tu cuenta está bloqueada por intentos fallidos. Verifica tu correo con un código para desbloquearla.',
      locked: true,
    });
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    // NUEVO: contamos el error
    const intentos = user.intentos_fallidos + 1;

    // NUEVO: si llegamos a 3, bloqueamos
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

    // NUEVO: guardamos el contador y avisamos cuántos intentos quedan
    await prisma.usuarios.update({
      where: { email },
      data: { intentos_fallidos: intentos },
    });

    return res.status(401).json({
      message: 'Credenciales inválidas',
      intentosRestantes: MAX_INTENTOS - intentos,
    });
  }

  // NUEVO: si la contraseña fue correcta, reiniciamos el contador
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
};

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  // NUEVO: revisamos la contraseña ANTES de hacer cualquier otra cosa
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
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email, token, newPassword } = req.body;

  const passCheck = validarPassword(newPassword);
  if (!passCheck.valid) {
    return res.status(400).json({ message: passCheck.message });
  }

  const registro = await prisma.tokens_verificacion.findFirst({
    where: { email, token, usado: false },
    orderBy: { creado_en: 'desc' },
  });

  if (!registro) {
    return res.status(400).json({ message: 'Código inválido.' });
  }
  if (registro.expira_en < new Date()) {
    return res.status(400).json({ message: 'El código expiró, solicita uno nuevo.' });
  }

  const user = await prisma.usuarios.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.usuarios.update({
    where: { email },
    // Cambiar la contraseña desbloquea la cuenta 
    // reinicia el contador de intentos fallidos.
    data: { password: hashed, intentos_fallidos: 0, bloqueado: false },
  });

  // Lo borramos directamente, ya cumplió su función

  await prisma.tokens_verificacion.delete({
    where: { id_token: registro.id_token },
  });

  // Aprovecha para limpiar cualquier otro código vencido que haya quedado.
  await limpiarTokensVencidos();

  return res.json({ message: 'Contraseña actualizada correctamente' });
};

export const getMe = (req: Request, res: Response) => {
  return res.json((req as any).user);
};

// Borra de la base de datos los códigos que ya vencieron o ya se usaron.

async function limpiarTokensVencidos() {
  await prisma.tokens_verificacion.deleteMany({
    where: {
      OR: [
        { expira_en: { lt: new Date() } }, // ya venció
        { usado: true },                    // ya se usó
      ],
    },
  });
}

// Genera un código de 6 dígitos y lo guarda en la base de datos.
export const requestToken = async (req: Request, res: Response) => {
  const { email } = req.body;

  await limpiarTokensVencidos();

  const user = await prisma.usuarios.findUnique({ where: { email } });

  if (!user) {
    return res.json({ message: 'Si el correo está registrado, se generó un código.' });
  }

  const token = generarCodigo();
  const expira_en = new Date(Date.now() + TOKEN_EXP_MINUTOS * 60 * 1000);

  await prisma.tokens_verificacion.create({
    data: { email, token, tipo: 'reset_password', expira_en },
  });

  return res.json({ message: 'Código generado', token });
};