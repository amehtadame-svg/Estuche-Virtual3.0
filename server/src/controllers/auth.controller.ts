import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.usuarios.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

  // Las contraseñas actuales son texto plano (123456), comparamos directo
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