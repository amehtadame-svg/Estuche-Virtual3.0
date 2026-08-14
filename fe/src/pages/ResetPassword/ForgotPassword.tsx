import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import './ForgotPassword.css';


export default function ForgotPassword() {
  const { generateResetToken } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]     = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  await generateResetToken(email);
  setMessage('Si el correo está registrado, recibirás el código en breve.');

  setLoading(false);
  // Le pasamos el correo a la siguiente pantalla para no pedirlo de nuevo.
  setTimeout(() => navigate('/reset-password', { state: { email } }), 2500);
};

  return (
    <div className="forgot-container">
      <div className="forgot-card">
        <h2>¿Olvidaste tu contraseña?</h2>
        <p className="forgot-subtitle">
          Ingresa tu correo y te enviaremos un token para recuperarla.
        </p>

        {message ? (
          <div className="forgot-success">
            <span>✅</span>
            <p>{message}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="forgot-field">
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="forgot-btn">
              {loading ? 'Enviando...' : 'Enviar instrucciones'}
            </button>
          </form>
        )}

        <Link to="/login" className="forgot-back">← Volver al login</Link>
      </div>
    </div>
  );
}