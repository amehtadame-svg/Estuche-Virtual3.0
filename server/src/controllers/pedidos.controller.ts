import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getPedidos = async (_req: Request, res: Response) => {
  const pedidos = await prisma.pedidos.findMany({
    include: { clientes: { select: { nombre: true } } },
    orderBy: { id_pedido: 'desc' },
  });
  return res.json(pedidos);
};

export const crearPedido = async (req: Request, res: Response) => {
  const { fecha, total, estado, metodo_pago, detalles } = req.body;
  const id_cliente = (req as any).user?.id;
  const rol = (req as any).user?.role;

  if (!id_cliente) {
    return res.status(401).json({ message: 'No se pudo identificar al usuario' });
  }
  if (!metodo_pago || !['efectivo', 'tarjeta'].includes(metodo_pago)) {
    return res.status(400).json({ message: 'Método de pago inválido' });
  }
  if (metodo_pago === 'efectivo' && rol !== 'empleado') {
    return res.status(403).json({ message: 'Tu rol no permite pagar en efectivo' });
  }

  const pedido = await prisma.$transaction(async (tx) => {
    const nuevoPedido = await tx.pedidos.create({
      data: {
        id_cliente,
        fecha: fecha ? new Date(fecha) : new Date(),
        total,
        estado: estado ?? 'Procesando',
        metodo_pago,
      },
    });

    if (Array.isArray(detalles) && detalles.length > 0) {
      await tx.detalle_pedido.createMany({
        data: detalles.map((d: any) => ({
          id_pedido: nuevoPedido.id_pedido,
          id_producto: d.id_producto,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
        })),
      });
    }

    return nuevoPedido;
  });

  return res.status(201).json(pedido);
};

export const editarPedido = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { id_cliente, id_empleado, fecha, total, estado, metodo_pago } = req.body;
  const pedido = await prisma.pedidos.update({
    where: { id_pedido: Number(id) },
    data: { id_cliente, id_empleado, fecha: fecha ? new Date(fecha) : null, total, estado, metodo_pago },
  });
  return res.json(pedido);
};

export const eliminarPedido = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.$transaction(async (tx) => {
    await tx.detalle_pedido.deleteMany({ where: { id_pedido: id } });
    await tx.envios.deleteMany({ where: { id_pedido: id } });
    await tx.pedidos.delete({ where: { id_pedido: id } });
  });
  return res.status(204).send();
};