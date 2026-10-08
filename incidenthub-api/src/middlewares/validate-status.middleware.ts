import type { RequestHandler } from 'express';
import { AppError } from '../errors/app-error';
import {
  INCIDENT_STATUSES,
  type IncidentStatus,
} from '../models/incident.model';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Valida y transforma el body de PATCH /:id/status en su DTO. */
export const validateStatus: RequestHandler = (req, _res, next) => {
  const body: unknown = req.body;

  if (!isObject(body) || typeof body.status !== 'string') {
    next(new AppError(400, 'status is required'));
    return;
  }

  if (
    !INCIDENT_STATUSES.includes(
      body.status as (typeof INCIDENT_STATUSES)[number],
    )
  ) {
    next(
      new AppError(
        400,
        `Invalid status. Allowed values: ${INCIDENT_STATUSES.join(', ')}`,
      ),
    );
    return;
  }

  req.validatedStatus = { status: body.status as IncidentStatus };
  next();
};
