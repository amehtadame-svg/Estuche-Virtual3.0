import { Request, Response } from 'express';
import { returnService } from './returns.service';
import { asyncHandler } from '../../middlewares/asyncHandler';

export const listReturns = asyncHandler(async (_req: Request, res: Response) => {
  const returns = await returnService.list();
  return res.json(returns);
});

export const getReturn = asyncHandler(async (req: Request, res: Response) => {
  const returnRequest = await returnService.getById(req.params.id);
  return res.json(returnRequest);
});

export const resolveReturn = asyncHandler(async (req: Request, res: Response) => {
  const returnRequest = await returnService.resolve(req.params.id, req.body);
  return res.json(returnRequest);
});
