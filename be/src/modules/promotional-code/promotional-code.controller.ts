import { Request, Response } from 'express';
import { promotionalCodeService } from './promotional-code.service';
import { asyncHandler } from '../../middlewares/asyncHandler';

export const listPromotionalCodes = asyncHandler(async (_req: Request, res: Response) => {
  const codes = await promotionalCodeService.list();
  return res.json(codes);
});

export const createPromotionalCode = asyncHandler(async (req: Request, res: Response) => {
  const code = await promotionalCodeService.create(req.body);
  return res.status(201).json(code);
});

export const updatePromotionalCode = asyncHandler(async (req: Request, res: Response) => {
  const code = await promotionalCodeService.update(req.params.id, req.body);
  return res.json(code);
});

export const togglePromotionalCode = asyncHandler(async (req: Request, res: Response) => {
  const code = await promotionalCodeService.toggleActive(req.params.id);
  return res.json(code);
});

export const deletePromotionalCode = asyncHandler(async (req: Request, res: Response) => {
  await promotionalCodeService.remove(req.params.id);
  return res.status(204).send();
});

export const validatePromotionalCode = asyncHandler(async (req: Request, res: Response) => {
  const code = await promotionalCodeService.validate(req.body.code, req.body.total);
  return res.json(code);
});

export const applyPromotionalCode = asyncHandler(async (req: Request, res: Response) => {
  const result = await promotionalCodeService.apply(req.body.code);
  return res.json(result);
});
