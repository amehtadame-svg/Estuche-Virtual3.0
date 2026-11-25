import {
  useEffect,
  useId,
  useRef,
} from 'react';
import type { ReactNode } from 'react';
import './Modal.css';

interface ModalProps {
  titulo: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export default function Modal({
  titulo,
  onClose,
  children,
  footer,
}: ModalProps) {
  const box = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);

  close.current = onClose;

  const titleId = useId();

  useEffect(() => {
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    const focusable = () =>
      Array.from(
        box.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]'
        ) || []
      ).filter(
        (element) =>
          element.getClientRects().length > 0
      );

    const frame = requestAnimationFrame(() =>
      (focusable()[0] || box.current)?.focus()
    );

    const handleKey = (
      event: KeyboardEvent
    ) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close.current();
      }

      if (event.key === 'Tab') {
        const elements = focusable();
        const first = elements[0];
        const last = elements[elements.length - 1];

        if (!first) {
          event.preventDefault();
          box.current?.focus();
          return;
        }

        if (
          event.shiftKey &&
          (
            document.activeElement === first ||
            document.activeElement === box.current
          )
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (
            document.activeElement === last ||
            !box.current?.contains(
              document.activeElement
            )
          )
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener(
      'keydown',
      handleKey
    );

    return () => {
      cancelAnimationFrame(frame);

      document.removeEventListener(
        'keydown',
        handleKey
      );

      document.body.style.overflow =
        previousOverflow;

      if (previous?.isConnected) {
        previous.focus();
      }
    };
  }, []);

  return (
    <div
      className="modal-overlay"
      onClick={() => close.current()}
    >
      <div
        className="modal-box"
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="modal-header">
          <h3
            className="modal-titulo"
            id={titleId}
          >
            {titulo}
          </h3>

          <button
            type="button"
            className="modal-cerrar"
            aria-label="Cerrar ventana"
            onClick={() => close.current()}
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {children}
        </div>

        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}