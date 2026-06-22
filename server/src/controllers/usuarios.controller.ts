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

export const previewEliminarUsuario = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const pedidosComoCliente = await prisma.pedidos.findMany({
    where: { id_cliente: id },
    select: { id_pedido: true }
  });
  const idsPedidosCliente = pedidosComoCliente.map(p => p.id_pedido);

  const pedidosComoEmpleado = await prisma.pedidos.count({ where: { id_empleado: id } });
  const envios = await prisma.envios.count({ where: { id_repartidor: id } });

  const detalles = idsPedidosCliente.length
    ? await prisma.detalle_pedido.count({ where: { id_pedido: { in: idsPedidosCliente } } })
    : 0;

  const enviosDePedidos = idsPedidosCliente.length
    ? await prisma.envios.count({ where: { id_pedido: { in: idsPedidosCliente } } })
    : 0;

  return res.json({
    pedidos_como_cliente: idsPedidosCliente.length,
    detalle_pedido: detalles,
    envios_de_esos_pedidos: enviosDePedidos,
    pedidos_como_empleado: pedidosComoEmpleado,
    envios_como_repartidor: envios,
  });
};

export const eliminarUsuario = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const pedidosComoCliente = await prisma.pedidos.findMany({
    where: { id_cliente: id },
    select: { id_pedido: true }
  });
  const idsPedidosCliente = pedidosComoCliente.map(p => p.id_pedido);

  await prisma.$transaction(async (tx) => {
    if (idsPedidosCliente.length) {
      await tx.detalle_pedido.deleteMany({ where: { id_pedido: { in: idsPedidosCliente } } });
      await tx.envios.deleteMany({ where: { id_pedido: { in: idsPedidosCliente } } });
      await tx.pedidos.deleteMany({ where: { id_pedido: { in: idsPedidosCliente } } });
    }

    // Pedidos donde este usuario figura como empleado: liberamos el vínculo, no se borran
    await tx.pedidos.updateMany({
      where: { id_empleado: id },
      data: { id_empleado: null }
    });

    // Envíos donde este usuario es repartidor: liberamos el vínculo
    await tx.envios.updateMany({
      where: { id_repartidor: id },
      data: { id_repartidor: null }
    });

    await tx.usuarios.delete({ where: { id_usuario: id } });
  });

  return res.status(204).send();
};