import { Request } from 'express';

// Extrae contexto de la petición (IP + User-Agent) para la bitácora de seguridad,
// manteniendo esos detalles HTTP fuera de la capa de servicios.
export const getRequestContext = (req: Request) => ({
  ip: (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() || req.ip || null,
  userAgent: req.headers['user-agent']?.slice(0, 255) || null,
});
