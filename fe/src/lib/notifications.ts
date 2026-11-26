import { referenceText } from './reference';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  kind: ToastKind;
  title: string;
  message: string;
}

export interface ConfirmationRequest {
  id: number;
  message: string;
  resolve: (confirmed: boolean) => void;
}

const EVENT_NAME = 'estuche:notification';
const CONFIRMATION_EVENT_NAME = 'estuche:confirmation';
let nextId = 1;

function defaultTitle(kind: ToastKind) {
  if (kind === 'success') return 'Operación exitosa';
  if (kind === 'error') return 'No se pudo completar';
  return 'Información';
}

function emit(kind: ToastKind, message: string, title = defaultTitle(kind)) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<ToastMessage>(EVENT_NAME, {
      detail: { id: nextId++, kind, title: referenceText(title), message: referenceText(message) },
    }),
  );
}

export const notify = {
  success: (message = 'La operación se completó correctamente.', title = 'Operación exitosa') =>
    emit('success', message, title),
  error: (message = 'Inténtalo de nuevo.', title = 'No se pudo completar') =>
    emit('error', message, title),
  info: (message: string, title = 'Información') => emit('info', message, title),
};

export function requestConfirmation(message: string): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  return new Promise((resolve) => {
    window.dispatchEvent(
      new CustomEvent<ConfirmationRequest>(CONFIRMATION_EVENT_NAME, {
        detail: { id: nextId++, message, resolve },
      }),
    );
  });
}

export const notificationEventName = EVENT_NAME;
export const confirmationEventName = CONFIRMATION_EVENT_NAME;