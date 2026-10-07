import { Request, Response } from 'express';
import { categoryService } from './categories.service';
import { asyncHandler } from '../../middlewares/asyncHandler';

export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  return res.json(await categoryService.list());
});

export const getCategory = asyncHandler(async (req: Request, res: Response) => {
  return res.json(await categoryService.getById(req.params.id));
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  return res.status(201).json(await categoryService.create(req.body));
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  return res.json(await categoryService.update(req.params.id, req.body));
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  await categoryService.remove(req.params.id);
  return res.status(204).send();
});
