import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const getUsuarios = async (req: Request, res: Response) => {
  const usuarios = await prisma.usuarios.findMany({
    select: { id_usuario: true, nombre: true, email: true, rol: true }
  });
  return res.json(usuarios);
};

export const updateRol = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { rol } = req.body;

  if (!['cliente', 'administrador'].includes(rol))
    return res.status(400).json({ message: 'Rol inválido' });

  const usuario = await prisma.usuarios.update({
    where: { id_usuario: Number(id) },
    data: { rol }
  });

  return res.json(usuario);
};

export const crearUsuario = async (req: Request, res: Response) => {
  const { nombre, email, password, rol } = req.body;

  const existe = await prisma.usuarios.findUnique({ where: { email } });
  if (existe) return res.status(400).json({ message: 'El correo ya está registrado' });

  const hashed = await bcrypt.hash(password, 10);
  const usuario = await prisma.usuarios.create({
    data: { nombre, email, password: hashed, rol: rol || 'cliente' }
  });

  return res.status(201).json(usuario);
};

export const editarUsuario = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombre, email, rol } = req.body;

  const usuario = await prisma.usuarios.update({
    where: { id_usuario: Number(id) },
    data: { nombre, email, rol }
  });

  return res.json(usuario);
};

export const eliminarUsuario = async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.usuarios.delete({ where: { id_usuario: Number(id) } });
  return res.status(204).send();
};