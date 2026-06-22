import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getEnvios = async (_req: Request, res: Response) => {
  const envios = await prisma.envios.findMany({
    include: {
      pedidos: { select: { id_pedido: true } },
      empleados: { select: { nombre: true } },
    },
    orderBy: { id_envio: 'desc' },
  });
  return res.json(envios);
};

export const crearEnvio = async (req: Request, res: Response) => {
  const { id_pedido, id_repartidor, direccion, estado } = req.body;
  const envio = await prisma.envios.create({ data: { id_pedido, id_repartidor, direccion, estado } });
  return res.status(201).json(envio);
};

export const editarEnvio = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { id_pedido, id_repartidor, direccion, estado } = req.body;
  const envio = await prisma.envios.update({
    where: { id_envio: Number(id) },
    data: { id_pedido, id_repartidor, direccion, estado },
  });
  return res.json(envio);
};

export const eliminarEnvio = async (req: Request, res: Response) => {
  await prisma.envios.delete({ where: { id_envio: Number(req.params.id) } });
  return res.status(204).send();
};