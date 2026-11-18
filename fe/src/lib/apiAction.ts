import { notify } from './notifications';

interface ApiActionOptions {
  url: string;
  init: RequestInit;
  successMessage: string;
  errorMessage: string;
}

/** Ejecuta una acción de escritura y solo confirma éxito ante una respuesta 2xx. */
export async function runApiAction({ url, init, successMessage, errorMessage }: ApiActionOptions): Promise<Response | null> {
  try {
    const response = await fetch(url, init);
    if (!response.ok) {
      const payload = await response.clone().json().catch(() => null);
      notify.error(payload?.message || errorMessage);
      return null;
    }
    const successTitle = /registrad|cread|agregad/i.test(successMessage)
      ? 'Registro exitoso'
      : /actualizad|guardad|aplicad|activad|cambiad/i.test(successMessage)
        ? 'Cambios guardados'
        : 'Operación exitosa';
    notify.success(successMessage, successTitle);
    return response;
  } catch {
    notify.error('No se pudo conectar con el servidor. Inténtalo de nuevo.');
    return null;
  }
}