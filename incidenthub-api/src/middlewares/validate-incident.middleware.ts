import type { RequestHandler } from 'express';
import { AppError } from '../errors/app-error';
import type {
  IncidentPriority,
} from '../models/incident.model';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Valida la estructura del body y construye un DTO con campos permitidos.
 * Los datos administrados por el servidor (id, status y createdAt) se descartan.
 */
export const validateIncident: RequestHandler = (req, _res, next) => {
  if (!isObject(req.body)) {
    next(new AppError(400, 'Request body must be a JSON object'));
    return;
  }

  const body = req.body;
  const isCreate = req.method === 'POST';
  const textFields = isCreate
    ? ['title', 'description', 'reporter', 'location']
    : ['title', 'description', 'location'];
  const invalidTextFields = textFields.filter(
    (field) => !isNonEmptyString(body[field]),
  );

  if (invalidTextFields.length > 0) {
    next(
      new AppError(
        400,
        `Required non-empty string fields: ${invalidTextFields.join(', ')}`,
      ),
    );
    return;
  }

  if (!isCreate && 'reporter' in body && !isNonEmptyString(body.reporter)) {
    next(new AppError(400, 'reporter must be a non-empty string'));
    return;
  }

  if (typeof body.priority !== 'string') {
    next(new AppError(400, 'priority is required and must be a string'));
    return;
  }

  if (typeof body.estimatedMinutes !== 'number') {
    next(new AppError(400, 'estimatedMinutes must be a number'));
    return;
  }

  const commonFields = {
    title: (body.title as string).trim(),
    description: (body.description as string).trim(),
    location: (body.location as string).trim(),
    priority: body.priority as IncidentPriority,
    estimatedMinutes: body.estimatedMinutes,
  };

  if (isCreate) {
    req.validatedIncident = {
      ...commonFields,
      reporter: (body.reporter as string).trim(),
    };
  } else {
    req.validatedIncident = {
      ...commonFields,
      ...(typeof body.reporter === 'string'
        ? { reporter: body.reporter.trim() }
        : {}),
    };
  }

  next();
};
