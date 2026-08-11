import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
export const getPagos = async (_req: Request, res: Response) => {
  const pagos = await prisma.pagos.findMany({
    include: {
      usuarios:  { select: { nombre: true, email: true } },
      facturas:  { select: { id_factura: true, total: true } },
    },
    orderBy: { id_pago: 'desc' },
  });
  return res.json(pagos);
};

export const getPagoById = async (req: Request, res: Response) => {
  const pago = await prisma.pagos.findUnique({
    where: { id_pago: Number(req.params.id) },
    include: {
      usuarios: { select: { nombre: true, email: true } },
      facturas: { select: { id_factura: true, total: true, estado_pago: true } },
    },
  });
  if (!pago) return res.status(404).json({ message: 'Pago no encontrado' });
  return res.json(pago);
};

export const actualizarEstadoPago = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { estado, fecha_confirmacion } = req.body;

  const estadosValidos = ['pendiente', 'aprobado', 'rechazado', 'reembolsado'];
  if (!estadosValidos.includes(estado))
    return res.status(400).json({ message: 'Estado inválido' });

  const pago = await prisma.pagos.update({
    where: { id_pago: Number(id) },
    data: {
      estado,
      fecha_confirmacion: fecha_confirmacion ? new Date(fecha_confirmacion) : estado === 'aprobado' ? new Date() : null,
    },
  });
  return res.json(pago);
};