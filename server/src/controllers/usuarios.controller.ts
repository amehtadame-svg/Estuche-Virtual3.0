import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
 
const prisma = new PrismaClient();
 
export const getUsuarios = async (_req: Request, res: Response) => {
  const usuarios = await prisma.usuarios.findMany({
    select: { id_usuario: true, nombre: true, email: true, rol: true },
  });
  return res.json(usuarios);
};
 
export const updateRol = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { rol } = req.body;
 
  const rolesValidos = ['superadmin', 'administrador', 'empleado', 'repartidor', 'cliente'];
  if (!rolesValidos.includes(rol))
    return res.status(400).json({ message: 'Rol inválido' });
 
  const usuario = await prisma.usuarios.update({
    where: { id_usuario: Number(id) },
    data: { rol },
  });
  return res.json(usuario);
};
 
export const crearUsuario = async (req: Request, res: Response) => {
  const { nombre, email, password, rol } = req.body;
  const rolSolicitante = (req as any).user?.role;

  // Admin no puede crear superadmin ni administrador
  if (rolSolicitante === 'administrador' &&
     (rol === 'superadmin' || rol === 'administrador')) {
    return res.status(403).json({ message: 'No puedes crear usuarios con ese rol.' });
  }

  const existe = await prisma.usuarios.findUnique({ where: { email } });
  if (existe) return res.status(400).json({ message: 'El correo ya está registrado' });

  const hashed = await bcrypt.hash(password, 10);
  const usuario = await prisma.usuarios.create({
    data: { nombre, email, password: hashed, rol: rol || 'cliente' },
  });
  return res.status(201).json(usuario);
};
 
export const editarUsuario = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombre, email, rol } = req.body;
  const usuario = await prisma.usuarios.update({
    where: { id_usuario: Number(id) },
    data: { nombre, email, rol },
  });
  return res.json(usuario);
};
 
export const previewEliminarUsuario = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
 
  const pedidosComoCliente = await prisma.pedidos.findMany({
    where:  { id_cliente: id },
    select: { id_pedido: true },
  });
  const idsPedidos = pedidosComoCliente.map(p => p.id_pedido);
 
  const pedidosComoRepartidor = await prisma.pedidos.count({ where: { id_repartidor: id } });
 
  const detalles = idsPedidos.length
    ? await prisma.detalle_pedido.count({ where: { id_pedido: { in: idsPedidos } } })
    : 0;
 
  const enviosDePedidos = idsPedidos.length
    ? await prisma.envios.count({ where: { id_pedido: { in: idsPedidos } } })
    : 0;
 
  return res.json({
    pedidos_como_cliente:     idsPedidos.length,
    detalle_pedido:           detalles,
    envios_de_esos_pedidos:   enviosDePedidos,
    pedidos_como_repartidor:  pedidosComoRepartidor,
  });
};
 
export const eliminarUsuario = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const rolSolicitante = (req as any).user?.role;

  // Solo superadmin puede eliminar
  if (rolSolicitante !== 'superadmin') {
    return res.status(403).json({ message: 'No tienes permisos para eliminar usuarios.' });
  }

  const pedidosComoCliente = await prisma.pedidos.findMany({
    where:  { id_cliente: id },
    select: { id_pedido: true },
  });
  const idsPedidos = pedidosComoCliente.map(p => p.id_pedido);

  await prisma.$transaction(async (tx) => {
    if (idsPedidos.length) {
      await tx.detalle_pedido.deleteMany({ where: { id_pedido: { in: idsPedidos } } });
      await tx.envios.deleteMany({ where: { id_pedido: { in: idsPedidos } } });
      await tx.facturas.deleteMany({ where: { id_pedido: { in: idsPedidos } } });
      await tx.pedidos.deleteMany({ where: { id_pedido: { in: idsPedidos } } });
    }

    await tx.pedidos.updateMany({
      where: { id_repartidor: id },
      data:  { id_repartidor: null },
    });

    await tx.usuarios.delete({ where: { id_usuario: id } });
  });

  return res.status(204).send();
};