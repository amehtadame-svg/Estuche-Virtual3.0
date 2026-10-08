import type { RequestHandler } from 'express';
import { AppError } from '../errors/app-error';
import { INCIDENT_PRIORITIES } from '../models/incident.model';

/** Rechaza prioridades diferentes a las cuatro definidas por el modelo. */
export const validatePriority: RequestHandler = (req, _res, next) => {
  const priority = req.validatedIncident?.priority;

  if (
    typeof priority !== 'string' ||
    !INCIDENT_PRIORITIES.includes(
      priority as (typeof INCIDENT_PRIORITIES)[number],
    )
  ) {
    next(
      new AppError(
        400,
        `Invalid priority. Allowed values: ${INCIDENT_PRIORITIES.join(', ')}`,
      ),
    );
    return;
  }

  next();
};
