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

export const validarDescuento = async (req: Request, res: Response) => {
  const { codigo, total } = req.body;

  if (!codigo) return res.status(400).json({ message: 'Código requerido' });

  const descuento = await prisma.descuentos.findFirst({
    where: { codigo: codigo.trim() },
  });

  if (!descuento) {
    return res.status(404).json({ message: 'Código inválido' });
  }

  if (!descuento.activo) {
    return res.status(400).json({ message: 'Este código ya no está activo' });
  }

  const ahora = new Date();
  if (descuento.fecha_inicio && ahora < descuento.fecha_inicio) {
    return res.status(400).json({ message: 'Este código aún no está disponible' });
  }
  if (descuento.fecha_fin && ahora > descuento.fecha_fin) {
    return res.status(400).json({ message: 'Este código ha expirado' });
  }

  if (descuento.minimo_compra && total < descuento.minimo_compra) {
    return res.status(400).json({
      message: `Compra mínima de $${descuento.minimo_compra.toLocaleString()} requerida`,
    });
  }
  if (descuento.usos_maximos !== null && descuento.usos_actuales !== null) {
  if (descuento.usos_actuales >= descuento.usos_maximos) {
    return res.status(400).json({ message: 'Este código alcanzó su límite de usos' });
  }
}

  return res.json(descuento);
};

export const aplicarDescuento = async (req: Request, res: Response) => {
  const { codigo } = req.body;

  const descuento = await prisma.descuentos.findFirst({
    where: { codigo: codigo.trim() },
  });

  if (!descuento) return res.status(404).json({ message: 'Código inválido' });

  await prisma.descuentos.update({
    where: { id_descuento: descuento.id_descuento },
    data:  { usos_actuales: { increment: 1 } },
  });

  return res.json({ id_descuento: descuento.id_descuento });
};