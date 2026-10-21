import { Request, Response } from 'express';
import { inventoryService } from './inventory.service';
import { asyncHandler } from '../../middlewares/asyncHandler';

export const listMovements = asyncHandler(async (req: Request, res: Response) => {
  const type = req.query.type as 'in' | 'out' | 'adjustment' | undefined;
  const movements = await inventoryService.listMovements(type);
  return res.json(movements);
});

export const registerInbound = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const result = await inventoryService.registerInbound(req.body, userId);
  return res.status(201).json(result);
});