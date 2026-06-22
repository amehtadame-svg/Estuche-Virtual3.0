import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getPedidos = async (_req: Request, res: Response) => {
  const pedidos = await prisma.pedidos.findMany({
    include: {
      clientes: { select: { nombre: true } },
    },
    orderBy: { id_pedido: 'desc' },
  });
  return res.json(pedidos);
};

export const crearPedido = async (req: Request, res: Response) => {
  const { id_cliente, id_empleado, fecha, total, estado } = req.body;
  const pedido = await prisma.pedidos.create({
    data: { id_cliente, id_empleado, fecha: fecha ? new Date(fecha) : null, total, estado },
  });
  return res.status(201).json(pedido);
};

export const editarPedido = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { id_cliente, id_empleado, fecha, total, estado } = req.body;
  const pedido = await prisma.pedidos.update({
    where: { id_pedido: Number(id) },
    data: { id_cliente, id_empleado, fecha: fecha ? new Date(fecha) : null, total, estado },
  });
  return res.json(pedido);
};

export const eliminarPedido = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.$transaction(async (tx) => {
    await tx.detalle_pedido.deleteMany({ where: { id_pedido: id } });
    await tx.envios.deleteMany({ where: { id_pedido: id } });
    await tx.pedidos.delete({ where: { id_pedido: id } });
  });
  return res.status(204).send();
};
