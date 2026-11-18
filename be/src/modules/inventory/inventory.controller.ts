import { Request, Response } from 'express';
import { inventoryService } from './inventory.service';
import { OUTBOUND_REASONS } from './inventory.schema';
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

export const registerOutbound = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const result = await inventoryService.registerOutbound(req.body, userId);
  return res.status(201).json(result);
});

// HU-003 · catálogo de motivos para poblar el <select> del formulario
export const listOutboundReasons = asyncHandler(async (_req: Request, res: Response) => {
  return res.json(OUTBOUND_REASONS);
});