import type { RequestHandler } from 'express';
import { AppError } from '../errors/app-error';

/** Valida la duración estimada y la regla adicional para prioridad crítica. */
export const validateTime: RequestHandler = (req, _res, next) => {
  const dto = req.validatedIncident;
  const estimatedMinutes: unknown = dto?.estimatedMinutes;

  if (
    typeof estimatedMinutes !== 'number' ||
    !Number.isFinite(estimatedMinutes)
  ) {
    next(new AppError(400, 'estimatedMinutes must be a number'));
    return;
  }

  if (estimatedMinutes <= 0 || estimatedMinutes > 480) {
    next(
      new AppError(400, 'estimatedMinutes must be greater than 0 and at most 480'),
    );
    return;
  }

  if (dto?.priority === 'CRITICAL' && estimatedMinutes > 60) {
    next(
      new AppError(400, 'CRITICAL incidents cannot exceed 60 estimated minutes'),
    );
    return;
  }

  next();
};
