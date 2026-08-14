// Errores HTTP reutilizables. Los servicios los lanzan y el middleware
// global de errores los convierte en respuestas JSON con el status adecuado.
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}

export const notFound = (message = 'Recurso no encontrado') =>
  new HttpError(404, message);

export const badRequest = (message = 'Solicitud inválida') =>
  new HttpError(400, message);

export const unauthorized = (message = 'No autorizado') =>
  new HttpError(401, message);

export const forbidden = (message = 'Acceso denegado') =>
  new HttpError(403, message);

export const conflict = (message = 'Conflicto') =>
  new HttpError(409, message);
