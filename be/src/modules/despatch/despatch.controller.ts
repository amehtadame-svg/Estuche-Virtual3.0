import { Request, Response } from 'express';
import { despatchService } from './despatch.service';
import { asyncHandler } from '../../middlewares/asyncHandler';

export const listDespatches = asyncHandler(async (_req: Request, res: Response) => {
  const despatches = await despatchService.list();
  return res.json(despatches);
});

export const createDespatch = asyncHandler(async (req: Request, res: Response) => {
  const despatch = await despatchService.create(req.body);
  return res.status(201).json(despatch);
});

export const updateDespatch = asyncHandler(async (req: Request, res: Response) => {
  const despatch = await despatchService.update(req.params.id, req.body);
  return res.json(despatch);
});

export const deleteDespatch = asyncHandler(async (req: Request, res: Response) => {
  await despatchService.remove(req.params.id);
  return res.status(204).send();
});
