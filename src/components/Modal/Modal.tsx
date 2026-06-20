import type { ReactNode } from 'react';
import './Modal.css';

interface ModalProps {
  titulo: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export default function Modal({ titulo, onClose, children, footer }: ModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <h3 className="modal-titulo">{titulo}</h3>
          <button className="modal-cerrar" onClick={onClose}>✕</button>
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