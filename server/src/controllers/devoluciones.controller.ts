import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDevoluciones = async (_req: Request, res: Response) => {
  const devoluciones = await prisma.devoluciones.findMany({
    include: {
      clientes:  { select: { nombre: true, email: true } },
      productos: { select: { nombre: true } },
      pedidos:   { select: { id_pedido: true } },
    },
    orderBy: { id_devolucion: 'desc' },
  });
  return res.json(devoluciones);
};

export const getDevolucionById = async (req: Request, res: Response) => {
  const devolucion = await prisma.devoluciones.findUnique({
    where: { id_devolucion: Number(req.params.id) },
    include: {
      clientes:  { select: { nombre: true, email: true } },
      productos: { select: { nombre: true, precio: true } },
      pedidos:   { select: { id_pedido: true, total: true } },
    },
  });
  if (!devolucion) return res.status(404).json({ message: 'Devolución no encontrada' });
  return res.json(devolucion);
};

export const resolverDevolucion = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { estado, reembolso, estado_producto } = req.body;

  const estadosValidos = ['aprobada', 'rechazada', 'reembolsada'];
  if (!estadosValidos.includes(estado))
    return res.status(400).json({ message: 'Estado inválido' });

  const devolucion = await prisma.devoluciones.update({
    where: { id_devolucion: Number(id) },
    data: {
      estado,
      estado_producto: estado_producto ?? undefined,
      reembolso:       reembolso       ?? undefined,
      fecha_resolucion: new Date(),
    },
  });
  return res.json(devolucion);
};