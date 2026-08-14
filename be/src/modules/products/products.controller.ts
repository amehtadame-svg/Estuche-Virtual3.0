import { Request, Response } from 'express';
import { productService } from './products.service';
import { asyncHandler } from '../../middlewares/asyncHandler';

export const listProducts = asyncHandler(async (_req: Request, res: Response) => {
  const products = await productService.list();
  return res.json(products);
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.create(req.body);
  return res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.update(req.params.id, req.body);
  return res.json(product);
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  await productService.remove(req.params.id);
  return res.status(204).send();
});
