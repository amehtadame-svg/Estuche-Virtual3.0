import { Request, Response } from 'express';
import { providerService } from './provider.service';
import { asyncHandler } from '../../middlewares/asyncHandler';

export const listProviders = asyncHandler(async (_req: Request, res: Response) => {
  const providers = await providerService.list();
  return res.json(providers);
});

export const createProvider = asyncHandler(async (req: Request, res: Response) => {
  const provider = await providerService.create(req.body);
  return res.status(201).json(provider);
});

export const updateProvider = asyncHandler(async (req: Request, res: Response) => {
  const provider = await providerService.update(req.params.id, req.body);
  return res.json(provider);
});

export const deleteProvider = asyncHandler(async (req: Request, res: Response) => {
  await providerService.remove(req.params.id);
  return res.status(204).send();
});
