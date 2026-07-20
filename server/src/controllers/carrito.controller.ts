import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Obtener carrito del usuario autenticado
export const getCarrito = async (req: Request, res: Response) => {
  const id_usuario = (req as any).user?.id;
  const items = await prisma.carrito.findMany({
    where: { id_usuario },
    include: {
      productos: {
        select: { id_producto: true, nombre: true, precio: true, stock: true, descripcion: true },
      },
    },
    orderBy: { fecha_agregado: 'asc' },
  });
  return res.json(items);
};

// Agregar o incrementar producto en carrito
export const agregarAlCarrito = async (req: Request, res: Response) => {
  const id_usuario = (req as any).user?.id;
  const { id_producto, cantidad = 1 } = req.body;

  if (!id_producto) return res.status(400).json({ message: 'id_producto es requerido' });

  const existe = await prisma.carrito.findUnique({
    where: { id_usuario_id_producto: { id_usuario, id_producto } },
  });

  if (existe) {
    const actualizado = await prisma.carrito.update({
      where: { id_usuario_id_producto: { id_usuario, id_producto } },
      data: { cantidad: existe.cantidad + cantidad },
      include: { productos: { select: { nombre: true, precio: true } } },
    });
    return res.json(actualizado);
  }

  const nuevo = await prisma.carrito.create({
    data: { id_usuario, id_producto, cantidad },
    include: { productos: { select: { nombre: true, precio: true } } },
  });
  return res.status(201).json(nuevo);
};

// Actualizar cantidad de un item
export const actualizarCantidad = async (req: Request, res: Response) => {
  const id_usuario = (req as any).user?.id;
  const { id_producto } = req.params;
  const { cantidad } = req.body;

  if (!cantidad || cantidad < 1) {
    await prisma.carrito.delete({
      where: { id_usuario_id_producto: { id_usuario, id_producto: Number(id_producto) } },
    });
    return res.status(204).send();
  }

  const item = await prisma.carrito.update({
    where: { id_usuario_id_producto: { id_usuario, id_producto: Number(id_producto) } },
    data: { cantidad },
    include: { productos: { select: { nombre: true, precio: true } } },
  });
  return res.json(item);
};

// Quitar producto del carrito
export const quitarDelCarrito = async (req: Request, res: Response) => {
  const id_usuario = (req as any).user?.id;
  const { id_producto } = req.params;
  await prisma.carrito.delete({
    where: { id_usuario_id_producto: { id_usuario, id_producto: Number(id_producto) } },
  });
  return res.status(204).send();
};

// Vaciar carrito completo
export const vaciarCarrito = async (req: Request, res: Response) => {
  const id_usuario = (req as any).user?.id;
  await prisma.carrito.deleteMany({ where: { id_usuario } });
  return res.status(204).send();
};