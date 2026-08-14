import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny } from 'zod';

interface ValidationSchemas {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
}

// Middleware de validación con Zod. Valida body y/o params y reemplaza
// req.body / req.params con los datos parseados.
export const validate =
  (schemas: ValidationSchemas) => (req: Request, res: Response, next: NextFunction) => {
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: 'Datos inválidos', errors: result.error.issues });
      }
      req.body = result.data;
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        return res.status(400).json({ message: 'Parámetros inválidos' });
      }
      req.params = result.data as Record<string, string>;
    }

    next();
  };
