import { Request, Response } from 'express';
import { returnService } from './returns.service';
import { asyncHandler } from '../../middlewares/asyncHandler';

export const listReturns = asyncHandler(async (req: Request, res: Response) => {
  const returns = await returnService.list((req as any).user);
  return res.json(returns);
});

export const getReturn = asyncHandler(async (req: Request, res: Response) => {
  const returnRequest = await returnService.getById(req.params.id, (req as any).user);
  return res.json(returnRequest);
});

export const resolveReturn = asyncHandler(async (req: Request, res: Response) => {
  const returnRequest = await returnService.resolve(req.params.id, req.body);
  return res.json(returnRequest);
});

export const createReturn = asyncHandler(async (req: Request, res: Response) => {
  return res.status(201).json(await returnService.create(req.body, (req as any).user));
});
