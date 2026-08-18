import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import './ForgotPassword.css';

export default function ForgotPassword() {
  const { generateResetToken } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]     = useState('');
  const [message, setMessage] = useState('');
  const [error, setError]     = useState('');
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Esto ahora SÍ llega al backend: POST /api/auth/forgot-password
    // El backend genera el código y lo envía por correo con nodemailer.
    const result = await generateResetToken(email.trim().toLowerCase());
    setLoading(false);

    if (!result.ok) {
      setError(result.message || 'No se pudo enviar el código. Inténtalo de nuevo.');
      return;
    }

    setMessage(result.message || 'Si el correo está registrado, recibirás el código en breve.');
    if (result.previewUrl) setPreview(result.previewUrl);

    // Le pasamos el correo a la siguiente pantalla para no pedirlo de nuevo.
    setTimeout(() => navigate('/reset-password', { state: { email: email.trim().toLowerCase() } }), 2500);
  };

  return (
    <div className="forgot-container">
      <div className="forgot-card">
        <h2>¿Olvidaste tu contraseña?</h2>
        <p className="forgot-subtitle">
          Ingresa tu correo y te enviaremos un código de 6 dígitos para recuperarla.
        </p>

        {message ? (
          <div className="forgot-success">
            <span>✅</span>
            <p>{message}</p>
            {preview && (
              <p style={{ fontSize: '.8rem', marginTop: 8 }}>
                Modo prueba:{' '}
                <a href={preview} target="_blank" rel="noreferrer">
                  ver el correo enviado
                </a>
              </p>
            )}
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

            {error && (
              <p style={{ color: '#e53e3e', fontSize: '0.85rem', margin: '8px 0', textAlign: 'center' }}>
                ⚠️ {error}
              </p>
            )}

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
