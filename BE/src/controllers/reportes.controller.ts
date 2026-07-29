import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getReportes = async (_req: Request, res: Response) => {
  const reportes = await prisma.reportes_ventas.findMany({
    orderBy: { fecha: 'desc' },
  });
  return res.json(reportes);
};

export const getResumenGeneral = async (_req: Request, res: Response) => {
  const [totalVendido, totalPagado, totalReembolsado, descuentosActivos, pedidosHoy, clientesNuevosHoy] =
    await Promise.all([
      prisma.reportes_ventas.aggregate({ _sum: { total_vendido: true } }),
      prisma.reportes_ventas.aggregate({ _sum: { total_pagado: true } }),
      prisma.reportes_ventas.aggregate({ _sum: { total_reembolsado: true } }),
      prisma.descuentos.count({ where: { activo: true } }),
      prisma.pedidos.count({ where: { fecha_pedido: { gte: new Date(new Date().setHours(0,0,0,0)) } } }),
      prisma.reportes_ventas.findFirst({ where: { fecha: new Date(new Date().setHours(0,0,0,0)) }, select: { clientes_nuevos: true } }),
    ]);

  return res.json({
    total_vendido:      totalVendido._sum.total_vendido      ?? 0,
    total_pagado:       totalPagado._sum.total_pagado        ?? 0,
    total_reembolsado:  totalReembolsado._sum.total_reembolsado ?? 0,
    descuentos_activos: descuentosActivos,
    pedidos_hoy:        pedidosHoy,
    clientes_nuevos_hoy: clientesNuevosHoy?.clientes_nuevos ?? 0,
  });
};