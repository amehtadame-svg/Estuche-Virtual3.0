import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import * as dotenv from 'dotenv';
dotenv.config();


export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.usuarios.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

  const valid = password === user.password || await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: 'Credenciales inválidas' });

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
  const { email, newPassword } = req.body;
  console.log('email recibido:', email);
  console.log('newPassword recibido:', newPassword);

  const user = await prisma.usuarios.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.usuarios.update({ where: { email }, data: { password: hashed } });

  return res.json({ message: 'Contraseña actualizada correctamente' });
};
export const getMe = (req: Request, res: Response) => {
  return res.json((req as any).user);
};