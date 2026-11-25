import { useEffect, useState, type ReactNode } from 'react';
import {
  confirmationEventName,
  notificationEventName,
  type ConfirmationRequest,
  type ToastMessage,
} from '../../lib/notifications';
import './ToastProvider.css';

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [successNotice, setSuccessNotice] = useState<ToastMessage | null>(null);
  const [confirmations, setConfirmations] = useState<ConfirmationRequest[]>([]);
  const activeConfirmation = confirmations[0] ?? null;
  const confirmationQuestionEnd = activeConfirmation?.message.indexOf('?') ?? -1;
  const confirmationQuestion = activeConfirmation
    ? confirmationQuestionEnd >= 0
      ? activeConfirmation.message.slice(0, confirmationQuestionEnd + 1).trim()
      : activeConfirmation.message.trim()
    : '';
  const confirmationDetail = activeConfirmation && confirmationQuestionEnd >= 0
    ? activeConfirmation.message.slice(confirmationQuestionEnd + 1).trim()
    : '';
  const inboundSuccessParts = successNotice?.message.match(
    /^((?:Ingreso confirmado|Salida confirmada):)\s*"([^"]+)"\s*(.+)$/,
  );

  useEffect(() => {
    const onNotification = (event: Event) => {
      const toast = (event as CustomEvent<ToastMessage>).detail;
      if (toast.kind === 'success') {
        setSuccessNotice(toast);
        return;
      }
      setToasts((current) => [...current, toast]);
      window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== toast.id)), 4200);
    };

    const onConfirmation = (event: Event) => {
      const request = (event as CustomEvent<ConfirmationRequest>).detail;
      setConfirmations((current) => [...current, request]);
    };

    window.addEventListener(notificationEventName, onNotification);
    window.addEventListener(confirmationEventName, onConfirmation);
    return () => {
      window.removeEventListener(notificationEventName, onNotification);
      window.removeEventListener(confirmationEventName, onConfirmation);
    };
  }, []);

  useEffect(() => {
    if (!successNotice || activeConfirmation) return;
    const timeoutId = window.setTimeout(() => setSuccessNotice(null), 4200);
    return () => window.clearTimeout(timeoutId);
  }, [successNotice, activeConfirmation]);

  const finishConfirmation = (confirmed: boolean) => {
    if (!activeConfirmation) return;
    activeConfirmation.resolve(confirmed);
    setConfirmations((current) => current.filter((item) => item.id !== activeConfirmation.id));
  };

  return (
    <>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-message toast-${toast.kind}`}
            role={toast.kind === 'error' ? 'alert' : 'status'}
          >
            <span className="toast-symbol" aria-hidden="true">
              {toast.kind === 'success' ? '✓' : toast.kind === 'error' ? '!' : 'i'}
            </span>
            <span className="toast-copy">
              <strong className="toast-title">{toast.title}</strong>
              <span className="toast-text">{toast.message}</span>
            </span>
            <button
              type="button"
              className="toast-close"
              aria-label="Cerrar notificación"
              onClick={() => setToasts((items) => items.filter((item) => item.id !== toast.id))}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {successNotice && !activeConfirmation && (
        <div className="success-notice-overlay">
          <section className="confirm-delete-dialog success-notice-dialog" role="status" aria-live="polite">
            <header className="confirm-delete-header">
              <span className="success-notice-icon" aria-hidden="true">✓</span>
              <h2>{successNotice.title}</h2>
              <button
                type="button"
                className="confirm-delete-close"
                aria-label="Cerrar notificación"
                onClick={() => setSuccessNotice(null)}
              >
                ×
              </button>
            </header>
            <div className="confirm-delete-body success-notice-body">
              {inboundSuccessParts ? (
                <p className="success-notice-message success-notice-inbound-message">
                  <span className="success-notice-prefix">{inboundSuccessParts[1]}</span>
                  <strong className="success-notice-product">
                    “{inboundSuccessParts[2]}”
                  </strong>
                  <span className="success-notice-detail">
                    {inboundSuccessParts[3]}
                  </span>
                </p>
              ) : (
                <p className="success-notice-message">{successNotice.message}</p>
              )}
            </div>
          </section>
        </div>
      )}

      {activeConfirmation && (
        <div className="confirm-delete-overlay" onClick={() => finishConfirmation(false)}>
          <section
            className="confirm-delete-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="confirm-delete-header">
              <span className="confirm-delete-icon" aria-hidden="true">!</span>
              <h2 id="confirm-delete-title">Confirmar eliminación</h2>
              <button
                type="button"
                className="confirm-delete-close"
                aria-label="Cerrar confirmación"
                onClick={() => finishConfirmation(false)}
              >
                ×
              </button>
            </header>

            <div className="confirm-delete-body">
              <p className="confirm-delete-message">{confirmationQuestion}</p>
              <p className="confirm-delete-note">
                {confirmationDetail || 'Confirma solo si deseas continuar con la eliminación.'}
              </p>
            </div>

            <footer className="confirm-delete-footer">
              <button
                type="button"
                className="confirm-delete-cancel"
                onClick={() => finishConfirmation(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="confirm-delete-submit"
                onClick={() => finishConfirmation(true)}
              >
                Sí, eliminar
              </button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
