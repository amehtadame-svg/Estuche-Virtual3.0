import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export const getProductos = async (_req: Request, res: Response) => {
  const productos = await prisma.productos.findMany({
    include: {
      categorias:  { select: { nombre: true } },
      proveedores: { select: { nombre: true } },
    },
    orderBy: { id_producto: 'desc' },
  });
  return res.json(productos);
};
 
export const crearProducto = async (req: Request, res: Response) => {
  const { nombre, descripcion, precio, id_categoria, id_proveedor, stock, stock_minimo } = req.body;
  const producto = await prisma.productos.create({
    data: {
      nombre,
      descripcion,
      precio,
      id_categoria:  id_categoria  ?? null,
      id_proveedor:  id_proveedor  ?? null,
      stock:         stock         ?? 0,
      stock_minimo:  stock_minimo  ?? 5,
    },
  });
  return res.status(201).json(producto);
};
 
export const editarProducto = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, id_categoria, id_proveedor, stock, stock_minimo } = req.body;
  const producto = await prisma.productos.update({
    where: { id_producto: Number(id) },
    data: {
      nombre,
      descripcion,
      precio,
      id_categoria: id_categoria ?? null,
      id_proveedor: id_proveedor ?? null,
      stock:        stock        !== undefined ? Number(stock) : undefined,
      stock_minimo: stock_minimo !== undefined ? Number(stock_minimo) : undefined,
    },
  });
  return res.json(producto);
};
 
export const eliminarProducto = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.$transaction(async (tx) => {
    await tx.movimientos_inventario.deleteMany({ where: { id_producto: id } });
    await tx.historial_precios.deleteMany({ where: { id_producto: id } });
//  await tx.imagenes.deleteMany({ where: { id_producto: id } });
    await tx.detalle_pedido.deleteMany({ where: { id_producto: id } });
    await tx.productos.delete({ where: { id_producto: id } });
  });
  return res.status(204).send();
};