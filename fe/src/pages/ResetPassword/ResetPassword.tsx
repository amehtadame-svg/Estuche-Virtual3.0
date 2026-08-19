import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { validarPassword } from '../../utils/validarPassword';
import PasswordInput from '../../components/ui/PasswordInput';
import './ResetPassword.css';

export default function ResetPassword() {
  const { resetPassword, verifyResetToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Si venimos de "Olvidé mi contraseña" o de un bloqueo por 3 intentos,
  const state = location.state as { email?: string; message?: string } | null;
  const emailFromState = state?.email ?? '';
  const lockMessage = state?.message ?? '';

  const [email, setEmail]           = useState(emailFromState);
  const [token, setToken]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState(false);
  const [step, setStep]             = useState<'token' | 'password'>('token');
  const [verifying, setVerifying]   = useState(false);

  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token.trim()) {
      setError('Ingresa el código de verificación.');
      return;
    }

    setVerifying(true);
    const { ok, message } = await verifyResetToken(email.trim(), token.toUpperCase());
    setVerifying(false);

    if (ok) {
      setStep('password');
    } else {
      setError(message || 'Código incorrecto.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Ingresa tu correo electrónico.');
      return;
    }

    // Validar que las contraseñas coincidan
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    // Reglas de contraseña segura (mayúscula, minúscula, número, carácter especial)
    const passCheck = validarPassword(password);
    if (!passCheck.valid) {
      setError(passCheck.message!);
      return;
    }

    // El backend valida el código: que exista, no esté usado y no haya expirado.
    const { ok, message } = await resetPassword(email.trim(), token.toUpperCase(), password);
    if (ok) {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } else {
      setError(message || 'No se pudo cambiar la contraseña. Intenta de nuevo.');
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
      {step === 'token' ? (
        <div className="reset-modal-overlay">
          <div className="reset-modal-card">
            <h2>Verifica tu código</h2>
            <p className="reset-subtitle">
              Ingresa el código que recibiste en tu correo para continuar.
            </p>

            {lockMessage && (
              <p className="reset-error" style={{ marginBottom: '10px' }}>
                🔒 {lockMessage}
              </p>
            )}

            <form onSubmit={handleVerifyToken}>
              <div className="reset-field">
                <label htmlFor="email">Correo electrónico</label>
                <input id="email" type="email" value={email} readOnly disabled />
              </div>

              <div className="reset-field">
                <label htmlFor="token">Código de verificación</label>
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

              {error && <p className="reset-error">⚠️ {error}</p>}

              <button type="submit" className="reset-btn" disabled={verifying}>
                {verifying ? 'Verificando...' : 'Verificar código'}
              </button>
            </form>

            <Link to="/forgot-password" className="reset-back">
              ← Solicitar nuevo código
            </Link>
          </div>
        </div>
      ) : (
        <div className="reset-card">
          <h2>Nueva contraseña</h2>
          <p className="reset-subtitle">Ingresa tu nueva contraseña.</p>

          <form onSubmit={handleSubmit}>
            <div className="reset-field">
              <label htmlFor="password">Nueva contraseña</label>
              <PasswordInput
                id="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
              />
              <p style={{ fontSize: '0.78rem', color: '#666', margin: '2px 0 0' }}>
                Debe tener mayúscula, minúscula, número y un carácter especial (!@#$%...).
              </p>
            </div>

            <div className="reset-field">
              <label htmlFor="confirm">Confirmar contraseña</label>
              <PasswordInput
                id="confirm"
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
        </div>
      )}
    </div>
  );
}