import { Request, Response } from 'express';
import { categoryService } from './categories.service';
import { asyncHandler } from '../../middlewares/asyncHandler';

export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await categoryService.list();
  return res.json(categories);
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.create(req.body);
  return res.status(201).json(category);
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.update(req.params.id, req.body);
  return res.json(category);
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  await categoryService.remove(req.params.id);
  return res.status(204).send();
});