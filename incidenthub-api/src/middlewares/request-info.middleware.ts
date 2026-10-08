import type { RequestHandler } from 'express';

/** Añade datos de contexto a la petición para los siguientes middlewares. */
export const requestInfoMiddleware: RequestHandler = (req, _res, next) => {
  req.requestInfo = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
  };

  next();
};
