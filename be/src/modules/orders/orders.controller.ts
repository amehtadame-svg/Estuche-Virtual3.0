import { Request, Response } from 'express';
import { orderService } from './orders.service';
import { asyncHandler } from '../../middlewares/asyncHandler';

const requesterFrom = (req: Request) => (req as any).user as { id: string; role: string };

export const listOrders = asyncHandler(async (_req: Request, res: Response) => {
  const orders = await orderService.list();
  return res.json(orders);
});

export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.getById(req.params.id);
  return res.json(order);
});

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.create(req.body, requesterFrom(req));
  return res.status(201).json(order);
});

export const updateOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.update(req.params.id, req.body);
  return res.json(order);
});

export const deleteOrder = asyncHandler(async (req: Request, res: Response) => {
  await orderService.remove(req.params.id);
  return res.status(204).send();
});

export const applyPromotionalCode = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.applyPromotionalCode(req.params.id, req.body.code, requesterFrom(req));
  return res.json(order);
});
