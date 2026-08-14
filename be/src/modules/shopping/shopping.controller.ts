import { Request, Response } from 'express';
import { shoppingService } from './shopping.service';
import { asyncHandler } from '../../middlewares/asyncHandler';

const userIdFrom = (req: Request) => (req as any).user.id as string;

export const getShopping = asyncHandler(async (req: Request, res: Response) => {
  const items = await shoppingService.list(userIdFrom(req));
  return res.json(items);
});

export const addItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await shoppingService.addItem(userIdFrom(req), req.body.productId, req.body.quantity);
  return res.status(201).json(item);
});

export const updateQuantity = asyncHandler(async (req: Request, res: Response) => {
  const item = await shoppingService.updateQuantity(userIdFrom(req), req.params.productId, req.body.quantity);
  if (!item) return res.status(204).send();
  return res.json(item);
});

export const removeItem = asyncHandler(async (req: Request, res: Response) => {
  await shoppingService.removeItem(userIdFrom(req), req.params.productId);
  return res.status(204).send();
});

export const clearShopping = asyncHandler(async (req: Request, res: Response) => {
  await shoppingService.clear(userIdFrom(req));
  return res.status(204).send();
});
