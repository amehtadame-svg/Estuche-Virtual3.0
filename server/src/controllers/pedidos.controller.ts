import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
 
const prisma = new PrismaClient();
 
export const getPedidos = async (_req: Request, res: Response) => {
  const pedidos = await prisma.pedidos.findMany({
    include: {
      clientes:     { select: { nombre: true } },
      repartidores: { select: { nombre: true } },
      descuentos:   { select: { codigo: true } },
    },
    orderBy: { id_pedido: 'desc' },
  });
  return res.json(pedidos);
};
 
export const crearPedido = async (req: Request, res: Response) => {
  const { id_direccion, id_descuento, total, estado, detalles } = req.body;
  const id_cliente = (req as any).user?.id;
 
  if (!id_cliente) {
    return res.status(401).json({ message: 'No se pudo identificar al usuario' });
  }
 
  const pedido = await prisma.$transaction(async (tx) => {
    const nuevoPedido = await tx.pedidos.create({
      data: {
        id_cliente,
        id_direccion: id_direccion ?? null,
        id_descuento: id_descuento ?? null,
        total:  total  ?? 0,
        estado: estado ?? 'pendiente',
      },
    });
 
    if (Array.isArray(detalles) && detalles.length > 0) {
      await tx.detalle_pedido.createMany({
        data: detalles.map((d: any) => ({
          id_pedido:   nuevoPedido.id_pedido,
          id_producto: d.id_producto,
          cantidad:    d.cantidad,
          precio:      d.precio,
        })),
      });
    }
 
    return nuevoPedido;
  });
 
  return res.status(201).json(pedido);
};
 
export const editarPedido = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { id_cliente, id_repartidor, id_descuento, id_direccion, total, estado } = req.body;
  const pedido = await prisma.pedidos.update({
    where: { id_pedido: Number(id) },
    data: { id_cliente, id_repartidor, id_descuento, id_direccion, total, estado },
  });
  return res.json(pedido);
};
 
export const eliminarPedido = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.$transaction(async (tx) => {
    await tx.detalle_pedido.deleteMany({ where: { id_pedido: id } });
    await tx.envios.deleteMany({ where: { id_pedido: id } });
    await tx.facturas.deleteMany({ where: { id_pedido: id } });
    await tx.pedidos.delete({ where: { id_pedido: id } });
  });
  return res.status(204).send();
};