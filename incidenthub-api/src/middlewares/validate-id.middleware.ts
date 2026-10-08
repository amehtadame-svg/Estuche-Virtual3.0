import type { RequestHandler } from 'express';
import { AppError } from '../errors/app-error';

/** Acepta solamente IDs numéricos enteros, seguros y positivos. */
export const validateId: RequestHandler = (req, _res, next) => {
  const id = req.params.id;

  if (
    typeof id !== 'string' ||
    !/^[1-9]\d*$/.test(id) ||
    !Number.isSafeInteger(Number(id))
  ) {
    next(new AppError(400, 'Invalid incident id'));
    return;
  }

  next();
};
