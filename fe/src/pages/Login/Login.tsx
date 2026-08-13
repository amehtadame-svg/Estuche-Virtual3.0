import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import emailjs from '@emailjs/browser';
import './Login.css';

// Mismos datos de EmailJS que usa la pantalla de "Olvidé mi contraseña".
const SERVICE_ID  = 'service_cpk14dk';
const TEMPLATE_ID = 'template_iw2ub0s';
const PUBLIC_KEY  = 'ysKRVpX_AojrEDk-x';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, generateResetToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark';
    if (isDark) document.body.classList.add('dark-mode');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (!result.ok) {
      // Caso especial: se acaba de bloquear la cuenta (o ya estaba bloqueada).
      // En vez de solo mostrar un error, generamos el código automáticamente,
      // lo enviamos por correo y llevamos al usuario a la pantalla para
      // ingresar el código + su nueva contraseña.
      if (result.locked) {
        const token = await generateResetToken(email);
        if (token) {
          try {
            await emailjs.send(
              SERVICE_ID,
              TEMPLATE_ID,
              { to_email: email, reset_token: token },
              PUBLIC_KEY
            );
          } catch (err) {
            console.error('EmailJS error:', err);
          }
        }
        setLoading(false);
        navigate('/reset-password', {
          state: { email, message: result.message },
        });
        return;
      }

      // Error normal: mostramos cuántos intentos quedan si el backend lo indica.
      const restantes = result.intentosRestantes;
      setError(
        restantes !== undefined
          ? `Correo o contraseña incorrectos. Te quedan ${restantes} intento(s) antes de que se bloquee tu cuenta.`
          : (result.message || 'Correo o contraseña incorrectos.')
      );
      setLoading(false);
      return;
    }

    const saved = JSON.parse(localStorage.getItem('user') || '{}');
    const role = saved.role;
    setLoading(false);
    if (role === 'cliente') navigate('/cliente');
    else if (role === 'superadmin') navigate('/superadmin');
    else navigate('/admin');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Iniciar sesión</h1>
        <p className="login-subtitle">Bienvenido de nuevo a Estuche Virtual</p>

        <form onSubmit={handleSubmit}>
          <label className="input-label">Correo electrónico</label>
          <input
            className="login-input"
            type="email"
            placeholder="tucorreo@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <label className="input-label">Contraseña</label>
          <input
            className="login-input"
            type="password"
            placeholder="Tu contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          {error && (
            <p style={{ color: '#e53e3e', fontSize: '0.85rem', margin: '4px 0 8px', textAlign: 'center' }}>
              ⚠️ {error}
            </p>
          )}

        <button type="submit" className="login-button" disabled={loading}>
          {loading ? 'Verificando...' : 'Iniciar sesión'}
        </button>

          <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.9rem' }}>
            <Link to="/forgot-password" style={{ color: '#aa3bff', textDecoration: 'none', fontWeight: '600' }}>
              ¿Olvidaste tu contraseña?
            </Link>
          </p>

          <p className="register-text">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="register-link">Regístrate aquí</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;