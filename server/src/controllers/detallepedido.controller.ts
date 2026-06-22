import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDetallePedidos = async (_req: Request, res: Response) => {
  const detalles = await prisma.detalle_pedido.findMany({
    include: {
      pedidos: { select: { id_pedido: true } },
      productos: { select: { nombre: true } },
    },
    orderBy: { id_detalle: 'desc' },
  });
  return res.json(detalles);
};

export const crearDetalle = async (req: Request, res: Response) => {
  const { id_pedido, id_producto, cantidad, precio_unitario } = req.body;
  const detalle = await prisma.detalle_pedido.create({
    data: { id_pedido, id_producto, cantidad, precio_unitario },
  });
  return res.status(201).json(detalle);
};

export const editarDetalle = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { id_pedido, id_producto, cantidad, precio_unitario } = req.body;
  const detalle = await prisma.detalle_pedido.update({
    where: { id_detalle: Number(id) },
    data: { id_pedido, id_producto, cantidad, precio_unitario },
  });
  return res.json(detalle);
};

export const eliminarDetalle = async (req: Request, res: Response) => {
  await prisma.detalle_pedido.delete({ where: { id_detalle: Number(req.params.id) } });
  return res.status(204).send();
};