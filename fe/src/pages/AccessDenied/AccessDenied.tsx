import { Link, useNavigate } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';

export default function AccessDenied() {
  const navigate = useNavigate();

  return (
    <main className="empty-state">
      <span className="empty-state-icon empty-state-icon--danger" aria-hidden="true">
        <ShieldOff size={34} />
      </span>
      <h1>Acceso denegado</h1>
      <p>Tu cuenta no tiene permisos para ver esta página. Si crees que es un error, contacta a un administrador.</p>
      <div className="empty-state-actions">
        <button type="button" className="ui-btn ui-btn--ghost" onClick={() => navigate(-1)}>
          Volver atrás
        </button>
        <Link to="/" className="ui-btn ui-btn--primary">
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
