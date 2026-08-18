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

/** PASO 1: envía el código de recuperación al correo. */
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.forgotPassword(req.body, getRequestContext(req));
  return res.json(result);
});

/** PASO 2: valida el código sin gastarlo. */
export const verifyResetToken = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.verifyResetToken(req.body);
  return res.json(result);
});

/** PASO 3: cambia la contraseña consumiendo el código. */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.resetPassword(req.body, getRequestContext(req));
  return res.json(result);
});

export const getMe = (req: Request, res: Response) => {
  return res.json((req as any).user);
};
