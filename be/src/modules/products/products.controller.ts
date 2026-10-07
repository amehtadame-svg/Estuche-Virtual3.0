import { Request, Response } from 'express';
import { productService } from './products.service';
import { asyncHandler } from '../../middlewares/asyncHandler';

/** Actor que ejecuta la operación: queda registrado en precio e inventario. */
const actorFrom = (req: Request) => ({ id: ((req as any).user?.id as string | undefined) ?? null });

export const listProducts = asyncHandler(async (_req: Request, res: Response) => {
  const products = await productService.list();
  return res.json(products);
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getById(req.params.id);
  return res.json(product);
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.create(req.body, actorFrom(req));
  return res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.update(req.params.id, req.body, actorFrom(req));
  return res.json(product);
});

/** PATCH /api/products/:id/stock — entrada (+) o salida (−) de mercancía. */
export const adjustStock = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.adjustStock(
    req.params.id,
    { delta: req.body.delta, reason: req.body.reason },
    actorFrom(req)
  );
  return res.json(product);
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  await productService.remove(req.params.id);
  return res.status(204).send();
});
