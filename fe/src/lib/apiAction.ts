import { notify } from './notifications';

interface ApiActionOptions {
  url: string;
  init: RequestInit;
  successMessage: string;
  successTitle?: string;
  errorMessage: string;
}

const pendingActions = new Set<string>();

/** Ejecuta una acción de escritura y solo confirma éxito ante una respuesta 2xx. */
export async function runApiAction({ url, init, successMessage, successTitle, errorMessage }: ApiActionOptions): Promise<Response | null> {
  const key = `${(init.method || 'GET').toUpperCase()} ${url}`;
  if (pendingActions.has(key)) return null;
  pendingActions.add(key);
  try {
    const response = await fetch(url, init);
    if (!response.ok) {
      const payload = await response.clone().json().catch(() => null);
      notify.error(payload?.message || errorMessage);
      return null;
    }
    const inferredTitle = /registrad|cread|agregad/i.test(successMessage)
      ? 'Registro exitoso'
      : /actualizad|guardad|aplicad|activad|cambiad/i.test(successMessage)
        ? 'Cambios guardados'
        : 'Operación exitosa';
    notify.success(successMessage, successTitle || inferredTitle);
    return response;
  } catch {
    notify.error('No se pudo confirmar la operación. Verifica el estado antes de intentarlo de nuevo.');
    return null;
  } finally {
    pendingActions.delete(key);
  }
}