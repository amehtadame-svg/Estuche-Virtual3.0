import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
 
const prisma = new PrismaClient();
 
export const getProveedores = async (_req: Request, res: Response) => {
  const proveedores = await prisma.proveedores.findMany({
    include: {
      proveedor_categoria: {
        include: {
          categorias: { select: { nombre: true } }
        }
      }
    },
    orderBy: { id_proveedor: 'desc' },
  });
  return res.json(proveedores);
};
 
export const crearProveedor = async (req: Request, res: Response) => {
  const { nombre, telefono, email, direccion } = req.body;
  const proveedor = await prisma.proveedores.create({
    data: { nombre, telefono, email, direccion },
  });
  return res.status(201).json(proveedor);
};
 
export const editarProveedor = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombre, telefono, email, direccion } = req.body;
  const proveedor = await prisma.proveedores.update({
    where: { id_proveedor: Number(id) },
    data: { nombre, telefono, email, direccion },
  });
  return res.json(proveedor);
};
 
export const eliminarProveedor = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.productos.updateMany({
    where: { id_proveedor: id },
    data:  { id_proveedor: null },
  });
  await prisma.proveedores.delete({ where: { id_proveedor: id } });
  return res.status(204).send();
};