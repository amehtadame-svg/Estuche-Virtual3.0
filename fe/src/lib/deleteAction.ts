import { notify, requestConfirmation } from './notifications';

const pendingDeletes = new Set<string>();

interface DeleteActionOptions {
  url: string;
  headers: HeadersInit;
  successMessage: string;
  confirmMessage?: string;
}

/** Ejecuta una baja y devuelve true solo si el servidor confirmó el éxito. */
export async function runDeleteAction({
  url,
  headers,
  successMessage,
  confirmMessage,
}: DeleteActionOptions): Promise<boolean> {
  if (pendingDeletes.has(url)) return false;
  pendingDeletes.add(url);

  try {
    if (confirmMessage && !(await requestConfirmation(confirmMessage))) return false;

    const response = await fetch(url, { method: 'DELETE', headers });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      notify.error(payload?.message || 'No se pudo eliminar. Inténtalo de nuevo.');
      return false;
    }

    notify.success(successMessage);
    return true;
  } catch {
    notify.error('No se pudo conectar con el servidor. No se realizó la eliminación.');
    return false;
  } finally {
    pendingDeletes.delete(url);
  }
}