import { useNavigate } from 'react-router-dom';

export default function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: '64px' }}>🚫</div>
      <h1 style={{ margin: '16px 0 8px' }}>Acceso denegado</h1>
      <p style={{ margin: '0 0 24px', color: 'var(--text)', opacity: 0.8 }}>
        No tienes permisos para ver esta página.
      </p>
      <button onClick={() => navigate('/')} className="btn-primario" style={{ cursor: 'pointer' }}>
        Volver al inicio
      </button>
    </div>
  );
}