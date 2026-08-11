import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { PedidosSchema } from './pedidos.schema';

export const getPedidos = async (req: Request, res: Response) => {
  const pedidos = await prisma.pedidos.findMany({
    include: {
      clientes: { select: { nombre: true } },
      usuarios_pedidos_id_repartidorTousuarios: { select: { nombre: true } },
      direcciones_entrega: { select: { direccion: true, ciudad: true } },
      descuentos: { select: { codigo: true, valor: true } },
    },
    orderBy: { fecha_pedido: 'desc' },
  });
  return res.json(pedidos);
};

export const getPedidoById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const pedido = await prisma.pedidos.findUnique({
    where: { id_pedido: Number(id) },
    include: {
      clientes: { select: { nombre: true } },
      direcciones_entrega: { select: { direccion: true, ciudad: true } },
    },
  });
  if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado.' });
  return res.json(pedido);
};

export const crearPedido = async (req: Request, res: Response) => {
  const validation = PedidosSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ message: validation.error.issues});
  }

  const { id_direccion, id_descuento, total, estado, detalles } = validation.data;
  const id_cliente = (req as any).user?.id;

  if (!id_cliente) {
    return res.status(401).json({ message: 'No se pudo identificar al usuario' });
  }

  try {
    const pedido = await prisma.$transaction(async (tx) => {
      let id_descuento_final = id_descuento ?? null;

      if (id_descuento) {
        const descuento = await tx.descuentos.findUnique({
          where: { id_descuento },
        });
        if (!descuento || !descuento.activo) {
          throw new Error('El descuento no está activo.');
        }
        await tx.descuentos.update({
          where: { id_descuento },
          data: { usos_actuales: { increment: 1 } },
        });
        id_descuento_final = id_descuento;
      }

      const nuevoPedido = await tx.pedidos.create({
        data: {
          id_cliente,
          id_direccion: id_direccion ?? null,
          id_descuento: id_descuento_final,
          total: total ?? 0,
          estado: estado ?? 'pendiente',
        },
      });

      if (Array.isArray(detalles) && detalles.length > 0) {
        for (const d of detalles) {
          const producto = await tx.productos.findUnique({
            where: { id_producto: d.id_producto },
          });
          if (!producto) {
            throw new Error(`Producto ${d.id_producto} no encontrado.`);
          }
          if (producto.stock < d.cantidad) {
            throw new Error(
              `Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock}, solicitado: ${d.cantidad}.`
            );
          }
        }
        await tx.detalle_pedido.createMany({
          data: detalles.map((d: any) => ({
            id_pedido: nuevoPedido.id_pedido,
            id_producto: d.id_producto,
            cantidad: d.cantidad,
            precio: d.precio,
          })),
        });
      }

      return nuevoPedido;
    });

    return res.status(201).json(pedido);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
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

export const aplicarDescuento = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { codigo } = req.body;
  const usuarioSolicitante = (req as any).user;

  if (!codigo) {
    return res.status(400).json({ message: 'El código de descuento es requerido.' });
  }

  const pedido = await prisma.pedidos.findUnique({ where: { id_pedido: Number(id) } });
  if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado.' });

  const esDueño = pedido.id_cliente === usuarioSolicitante?.id;
  const esAdmin = ['superadmin', 'administrador'].includes(usuarioSolicitante?.role);
  if (!esDueño && !esAdmin) {
    return res.status(403).json({ message: 'No puedes modificar este pedido.' });
  }

  try {
    // Reemplaza $executeRaw inseguro por actualización atómica segura
    const descuento = await prisma.descuentos.findFirst({ where: { codigo: String(codigo).trim() } });
    if (!descuento) return res.status(404).json({ message: 'Código de descuento no encontrado.' });

    await prisma.descuentos.update({
      where: { id_descuento: descuento.id_descuento },
      data: { usos_actuales: { increment: 1 } },
    });

    await prisma.pedidos.update({
      where: { id_pedido: Number(id) },
      data: { id_descuento: descuento.id_descuento },
    });

    const pedidoActualizado = await prisma.pedidos.findUnique({
      where: { id_pedido: Number(id) },
      include: { descuentos: { select: { codigo: true, valor: true, tipo: true } } },
    });
    return res.json(pedidoActualizado);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};
