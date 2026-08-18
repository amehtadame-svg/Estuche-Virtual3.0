import { ErrorRequestHandler } from 'express';
import { HttpError } from '../lib/errors';

// Middleware global de errores: convierte HttpError en JSON y el resto en 500.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      ok: false,
      message: err.message,
      ...(err.details ?? {}),
    });
  }
  console.error(err);
  return res.status(500).json({ ok: false, message: 'Error interno del servidor' });
};