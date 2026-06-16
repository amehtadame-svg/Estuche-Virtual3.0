import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const Login = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');  
  const { login } = useAuth();  
  const navigate                = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    //  ahora esta en AuthContext 
    const success = login(email, password);

    if (!success) {
      setError('Correo o contraseña incorrectos.');
      return;
    }

    const saved = JSON.parse(localStorage.getItem('user') || '{}');
    navigate(saved.role === 'cliente' ? '/cliente' : '/admin');
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
            <p style={{ color: '#e53e3e', fontSize: '0.85rem', margin: '4px 0 8px' }}>
              ⚠️ {error}
            </p>
          )}

          <button type="submit" className="login-button">
            Iniciar sesión

          </button>

          <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.9rem' }}>
            <Link
              to="/forgot-password"
              style={{ color: '#667eea', textDecoration: 'none' }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </p>

          <p className="register-text">
            ¿No tienes cuenta?{''}
            <Link to="/register" className="register-link">
              Regístrate aquí            
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;