import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getFacturas = async (_req: Request, res: Response) => {
  const facturas = await prisma.facturas.findMany({
    include: { clientes: { select: { nombre: true } } },
    orderBy: { id_factura: 'desc' },
  });
  return res.json(facturas);
};

export const crearFactura = async (req: Request, res: Response) => {
  const { id_cliente, fecha, total, estado } = req.body;
  const factura = await prisma.facturas.create({
    data: { id_cliente, fecha: fecha ? new Date(fecha) : null, total, estado },
  });
  return res.status(201).json(factura);
};

export const editarFactura = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { id_cliente, fecha, total, estado } = req.body;
  const factura = await prisma.facturas.update({
    where: { id_factura: Number(id) },
    data: { id_cliente, fecha: fecha ? new Date(fecha) : null, total, estado },
  });
  return res.json(factura);
};

export const eliminarFactura = async (req: Request, res: Response) => {
  await prisma.facturas.delete({ where: { id_factura: Number(req.params.id) } });
  return res.status(204).send();
};