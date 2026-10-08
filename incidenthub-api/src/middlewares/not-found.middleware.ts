import type { RequestHandler } from 'express';
import { AppError } from '../errors/app-error';

/** Envía las rutas no registradas al manejador centralizado de errores. */
export const notFoundMiddleware: RequestHandler = (_req, _res, next) => {
  next(new AppError(404, 'Route not found'));
};
