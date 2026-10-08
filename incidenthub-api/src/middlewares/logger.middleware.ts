import type { RequestHandler } from 'express';

/** Registra cada petición al terminar, incluyendo el código HTTP de respuesta. */
export const loggerMiddleware: RequestHandler = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;

  res.once('finish', () => {
    console.info(`[${timestamp}] ${method} ${path} ${res.statusCode}`);
  });

  next();
};
