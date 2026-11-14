import { Request, Response } from 'express';
import { comboService } from './combos.service';
import { asyncHandler } from '../../middlewares/asyncHandler';

export const createCombo = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const combo = await comboService.create(req.body, userId);
  return res.status(201).json(combo);
});

export const listCombos = asyncHandler(async (_req: Request, res: Response) => {
  const combos = await comboService.list();
  return res.json(combos);
});

export const updateCombo = asyncHandler(async (req: Request, res: Response) => {
  const combo = await comboService.update(req.params.id, req.body);
  return res.json(combo);
});

export const deleteCombo = asyncHandler(async (req: Request, res: Response) => {
  await comboService.remove(req.params.id);
  return res.status(204).send();
});