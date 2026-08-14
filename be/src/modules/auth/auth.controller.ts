import { Request, Response } from 'express';
import { authService } from './auth.service';
import { getRequestContext } from '../../lib/requestContext';
import { asyncHandler } from '../../middlewares/asyncHandler';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body, getRequestContext(req));
  return res.json(result);
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body, getRequestContext(req));
  return res.status(201).json(result);
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.resetPassword(req.body, getRequestContext(req));
  return res.json(result);
});

export const getMe = (req: Request, res: Response) => {
  return res.json((req as any).user);
};
