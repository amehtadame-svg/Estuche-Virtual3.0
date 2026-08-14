import { Request, Response } from 'express';
import { userService } from './users.service';
import { asyncHandler } from '../../middlewares/asyncHandler';

const requesterFrom = (req: Request) => (req as any).user as { id: string; role: string } | undefined;

export const listUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await userService.list();
  return res.json(users);
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getById(req.params.id, requesterFrom(req));
  return res.json(user);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateProfile(req.params.id, req.body, requesterFrom(req));
  return res.json(user);
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateRole(req.params.id, req.body.role, requesterFrom(req));
  return res.json(user);
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.create(req.body, requesterFrom(req));
  return res.status(201).json(user);
});

export const editUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.edit(req.params.id, req.body, requesterFrom(req));
  return res.json(user);
});

export const previewDeleteUser = asyncHandler(async (req: Request, res: Response) => {
  const summary = await userService.previewDelete(req.params.id, requesterFrom(req));
  return res.json(summary);
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await userService.remove(req.params.id, requesterFrom(req));
  return res.status(204).send();
});
