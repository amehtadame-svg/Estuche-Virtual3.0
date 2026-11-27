import { Request, Response } from 'express';
import { orderDetailService } from './order-details.service';
import { asyncHandler } from '../../middlewares/asyncHandler';

export const listOrderDetails = asyncHandler(async (_req: Request, res: Response) => {
  const details = await orderDetailService.list();
  return res.json(details);
});

export const createOrderDetail = asyncHandler(async (req: Request, res: Response) => {
  const detail = await orderDetailService.create(req.body);
  return res.status(201).json(detail);
});

export const updateOrderDetail = asyncHandler(async (req: Request, res: Response) => {
  const detail = await orderDetailService.update(req.params.id, req.body, (req as any).user);
  return res.json(detail);
});

export const deleteOrderDetail = asyncHandler(async (req: Request, res: Response) => {
  await orderDetailService.remove(req.params.id, req.body.expected, (req as any).user);
  return res.status(204).send();
});
