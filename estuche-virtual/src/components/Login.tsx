import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// 1. Agregamos esta "Interface" para avisarle a TypeScript qué props recibe este componente
interface LoginPageProps {
  onLoginExitoso?: (correo: string, pass: string) => void;
}

// 2. Agregamos { onLoginExitoso } en los paréntesis de la función
export default function LoginPage({ onLoginExitoso }: LoginPageProps) {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!correo || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    // 3. Si la función existe, la ejecutamos antes de navegar
    if (onLoginExitoso) {
      onLoginExitoso(correo, password);
    }
    
    navigate('/');
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: '16px',
    color: 'var(--text-h)',
    backgroundColor: 'var(--bg)'
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'var(--bg)', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '400px', border: '1px solid var(--border)' }}>
        <h2 style={{ color: 'var(--text-h)', textAlign: 'center', marginBottom: '8px' }}>Iniciar sesión</h2>
        <p style={{ color: 'var(--text)', textAlign: 'center', fontSize: '14px', marginBottom: '32px' }}>
          Bienvenido de nuevo a Estuche Virtual
        </p>
        
        {error && (
          <div style={{ backgroundColor: '#fff0f0', border: '1px solid #e74c3c', borderRadius: '8px', padding: '10px 14px', color: '#e74c3c', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text)' }}>Correo electrónico</p>
        <input 
          type="email" 
          value={correo} 
          onChange={(e) => setCorreo(e.target.value)} 
          placeholder="tucorreo@email.com" 
          style={inputStyle} 
        />

        <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text)' }}>Contraseña</p>
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="Tu contraseña" 
          style={inputStyle} 
        />

        <button 
          onClick={handleLogin} 
          style={{ backgroundColor: 'var(--accent)', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', width: '100%', marginBottom: '16px' }}
        >
          Iniciar sesión
        </button>

        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text)' }}>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}