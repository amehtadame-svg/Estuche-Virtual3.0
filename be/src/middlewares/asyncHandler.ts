import { Request, Response, NextFunction, RequestHandler } from 'express';

// Envuelve un handler async para que las promesas rechazadas vayan al middleware
// de errores en lugar de quedar sin capturar.
type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export const asyncHandler =
  (fn: AsyncHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
