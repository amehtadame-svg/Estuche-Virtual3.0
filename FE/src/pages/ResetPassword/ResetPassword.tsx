import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import './ResetPassword.css';

export default function ResetPassword() {
  const { resetPassword, validateResetToken } = useAuth();
  const navigate = useNavigate();

  const [token, setToken]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState(false);

  const handleSubmit  = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar que las contraseñas coincidan
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    // Validar el token antes de intentar el reset
    const { valid, reason } = validateResetToken(token.toUpperCase());
    if (!valid) {
      setError(reason || 'Token inválido.');
      return;
    }

    // Ejecutar el cambio de contraseña
    const ok  = await resetPassword(token.toUpperCase(), password);
    if (ok) {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } else {
      setError('No se pudo cambiar la contraseña. Intenta de nuevo.');
    }
  };

  if (success) {
    return (
      <div className="reset-container">
        <div className="reset-card">
          <div className="reset-success">
            <span>🎉</span>
            <h3>¡Contraseña actualizada!</h3>
            <p>Serás redirigido al login en unos segundos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-container">
      <div className="reset-card">
        <h2>Nueva contraseña</h2>
        <p className="reset-subtitle">
          Ingresa el token que recibiste y tu nueva contraseña.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="reset-field">
            <label htmlFor="token">Token de verificación</label>
            <input
              id="token"
              type="text"
              value={token}
              onChange={e => setToken(e.target.value.toUpperCase())}
              placeholder="Ej: A3F9K2"
              maxLength={6}
              required
            />
          </div>

          <div className="reset-field">
            <label htmlFor="password">Nueva contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <div className="reset-field">
            <label htmlFor="confirm">Confirmar contraseña</label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repite la contraseña"
              required
            />
          </div>

          {error && <p className="reset-error">⚠️ {error}</p>}

          <button type="submit" className="reset-btn">
            Cambiar contraseña
          </button>
        </form>

        <Link to="/forgot-password" className="reset-back">
          ← Solicitar nuevo token
        </Link>
      </div>
    </div>
  );
}