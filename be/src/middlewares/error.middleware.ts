import { ErrorRequestHandler } from 'express';
import { HttpError } from '../lib/errors';

// Middleware global de errores: convierte HttpError en JSON y el resto en 500.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }
  console.error(err);
  return res.status(500).json({ message: 'Error interno del servidor' });
};
