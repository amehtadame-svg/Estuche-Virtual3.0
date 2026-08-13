import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import './ForgotPassword.css';

const SERVICE_ID  = 'service_cpk14dk'; 
const TEMPLATE_ID = 'template_iw2ub0s';
const PUBLIC_KEY  = 'ysKRVpX_AojrEDk-x';

export default function ForgotPassword() {
  const { generateResetToken } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]     = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  // Ahora esto le pregunta al backend y espera la respuesta (por eso "await").
  const token = await generateResetToken(email);

  try {
    if (token) {
      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
          to_email:    email,
          reset_token: token,
        },
        PUBLIC_KEY
      );
    }
    // Mismo mensaje siempre por seguridad
    setMessage('Si el correo está registrado, recibirás el código en breve.');
  } catch (err) {
    console.error('EmailJS error:', err);
    setMessage('Hubo un problema al enviar el correo. Intenta de nuevo.');
  }

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