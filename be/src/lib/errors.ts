// Errores HTTP reutilizables. Los servicios los lanzan y el middleware
// global de errores los convierte en respuestas JSON con el status adecuado.
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const notFound = (message = 'Recurso no encontrado', details?: Record<string, unknown>) =>
  new HttpError(404, message, details);

export const badRequest = (message = 'Solicitud inválida', details?: Record<string, unknown>) =>
  new HttpError(400, message, details);

export const unauthorized = (message = 'No autorizado', details?: Record<string, unknown>) =>
  new HttpError(401, message, details);

export const forbidden = (message = 'Acceso denegado', details?: Record<string, unknown>) =>
  new HttpError(403, message, details);

export const conflict = (message = 'Conflicto', details?: Record<string, unknown>) =>
  new HttpError(409, message, details);

export const locked = (message = 'Cuenta bloqueada', details?: Record<string, unknown>) =>
  new HttpError(423, message, details);

export const tooManyRequests = (message = 'Demasiadas solicitudes', details?: Record<string, unknown>) =>
  new HttpError(429, message, details);