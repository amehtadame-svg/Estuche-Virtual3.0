import { Request, Response } from 'express';
import { orderService } from './orders.service';
import { asyncHandler } from '../../middlewares/asyncHandler';

const requesterFrom = (req: Request) => (req as any).user as { id: string; role: string } | undefined;

export const listOrders = asyncHandler(async (req: Request, res: Response) => {
  // Con sesión iniciada cada usuario ve lo que le corresponde:
  // el cliente sus pedidos, el personal todos (C-05 / RF-011).
  const orders = await orderService.list(requesterFrom(req));
  return res.json(orders);
});

export const listMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const requester = requesterFrom(req);
  if (!requester) return res.status(401).json({ message: 'Token requerido' });
  return res.json(await orderService.listMine(requester.id));
});

export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.getById(req.params.id, requesterFrom(req));
  return res.json(order);
});

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const requester = requesterFrom(req);
  if (!requester) return res.status(401).json({ message: 'Token requerido' });
  const order = await orderService.create(req.body, requester);
  return res.status(201).json(order);
});

export const updateOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.update(req.params.id, req.body, requesterFrom(req));
  return res.json(order);
});

export const deleteOrder = asyncHandler(async (req: Request, res: Response) => {
  await orderService.remove(req.params.id, requesterFrom(req));
  return res.status(204).send();
});

export const applyPromotionalCode = asyncHandler(async (req: Request, res: Response) => {
  const requester = requesterFrom(req);
  if (!requester) return res.status(401).json({ message: 'Token requerido' });
  const order = await orderService.applyPromotionalCode(req.params.id, req.body.code, requester);
  return res.json(order);
});
