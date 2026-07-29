import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark';
    if (isDark) document.body.classList.add('dark-mode');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await login(email, password);
    if (!success) {
      setError('Correo o contraseña incorrectos.');
      return;
    }
    const saved = JSON.parse(localStorage.getItem('user') || '{}');
    const role = saved.role;
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

          <button type="submit" className="login-button">Iniciar sesión</button>

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