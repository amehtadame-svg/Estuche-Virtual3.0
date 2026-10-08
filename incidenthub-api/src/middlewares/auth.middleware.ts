import type { RequestHandler } from 'express';
import { AppError } from '../errors/app-error';
import type { AuthenticatedUser } from '../models/request.model';

const USERS_BY_TOKEN: Readonly<Record<string, AuthenticatedUser>> = {
  'instructor-token': { username: 'instructor', role: 'ADMIN' },
  'technician-token': { username: 'technician', role: 'TECHNICIAN' },
};

/** Valida los tokens de práctica y adjunta el usuario autenticado a req. */
export const authenticate: RequestHandler = (req, _res, next) => {
  const authorization = req.get('authorization');
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);
  const token = match?.[1];
  const user = token ? USERS_BY_TOKEN[token] : undefined;

  if (!user) {
    next(new AppError(401, 'Unauthorized'));
    return;
  }

  req.user = { ...user };
  next();
};
