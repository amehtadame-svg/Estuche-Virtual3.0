import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { pqrService, PqrActor } from './pqr.service';

const actorFrom = (req: Request) => (req as any).user as PqrActor;

export const listPqr = asyncHandler(async (req: Request, res: Response) => {
  const requests = await pqrService.list(actorFrom(req));
  return res.json(requests);
});

export const getPqr = asyncHandler(async (req: Request, res: Response) => {
  const request = await pqrService.getById(req.params.id, actorFrom(req));
  return res.json(request);
});

export const createPqr = asyncHandler(async (req: Request, res: Response) => {
  const request = await pqrService.create(req.body, actorFrom(req));
  return res.status(201).json(request);
});

export const updatePqr = asyncHandler(async (req: Request, res: Response) => {
  const request = await pqrService.update(req.params.id, req.body, actorFrom(req));
  return res.json(request);
});