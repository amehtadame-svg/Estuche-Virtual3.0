import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDescuentos = async (_req: Request, res: Response) => {
  const descuentos = await prisma.descuentos.findMany({
    orderBy: { id_descuento: 'desc' },
  });
  return res.json(descuentos);
};

export const crearDescuento = async (req: Request, res: Response) => {
  const { codigo, descripcion, tipo, valor, minimo_compra, fecha_inicio, fecha_fin, usos_maximos, activo } = req.body;
  const descuento = await prisma.descuentos.create({
    data: { codigo, descripcion, tipo, valor, minimo_compra, fecha_inicio: new Date(fecha_inicio), fecha_fin: new Date(fecha_fin), usos_maximos, activo },
  });
  return res.status(201).json(descuento);
};

export const editarDescuento = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { codigo, descripcion, tipo, valor, minimo_compra, fecha_inicio, fecha_fin, usos_maximos, activo } = req.body;
  const descuento = await prisma.descuentos.update({
    where: { id_descuento: Number(id) },
    data: { codigo, descripcion, tipo, valor, minimo_compra, fecha_inicio: fecha_inicio ? new Date(fecha_inicio) : undefined, fecha_fin: fecha_fin ? new Date(fecha_fin) : undefined, usos_maximos, activo },
  });
  return res.json(descuento);
};

export const toggleDescuento = async (req: Request, res: Response) => {
  const { id } = req.params;
  const actual = await prisma.descuentos.findUnique({ where: { id_descuento: Number(id) } });
  if (!actual) return res.status(404).json({ message: 'Descuento no encontrado' });
  const descuento = await prisma.descuentos.update({
    where: { id_descuento: Number(id) },
    data: { activo: !actual.activo },
  });
  return res.json(descuento);
};

export const eliminarDescuento = async (req: Request, res: Response) => {
  await prisma.descuentos.delete({ where: { id_descuento: Number(req.params.id) } });
  return res.status(204).send();
};