import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
 
export const getFacturas = async (_req: Request, res: Response) => {
  const facturas = await prisma.facturas.findMany({
    include: {
      clientes: { select: { nombre: true } },
      usuarios_facturas_id_empleadoTousuarios: { select: { nombre: true } },
      pedidos:  { select: { id_pedido: true, total: true } },
    },
    orderBy: { id_factura: 'desc' },
  });
  return res.json(facturas);
};

export const crearFactura = async (req: Request, res: Response) => {
  const { id_cliente, id_empleado, id_pedido, total, estado_pago } = req.body;
  const factura = await prisma.facturas.create({
    data: { id_cliente, id_empleado, id_pedido, total, estado_pago },
  });
  return res.status(201).json(factura);
};

export const editarFactura = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { id_cliente, id_empleado, total, estado_pago } = req.body;
  const factura = await prisma.facturas.update({
    where: { id_factura: Number(id) },
    data: { id_cliente, id_empleado, total, estado_pago },
  });
  return res.json(factura);
};

export const eliminarFactura = async (req: Request, res: Response) => {
  await prisma.facturas.delete({ where: { id_factura: Number(req.params.id) } });
  return res.status(204).send();
};