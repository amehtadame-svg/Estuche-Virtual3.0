import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// 1. Definimos qué información (props) puede recibir este componente
interface RegistroPageProps {
  onRegistroExitoso?: (nombre: string, correo: string, pass: string) => void;
}

// 2. Aplicamos la interface en los parámetros de la función
export default function RegistroPage({ onRegistroExitoso }: RegistroPageProps) {
  const navigate = useNavigate();
  const [formulario, setFormulario] = useState({ 
    nombre: '', 
    correo: '', 
    password: '', 
    confirmar: '' 
  });
  const [error, setError] = useState('');

  const handleCambio = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const handleRegistro = () => {
    if (!formulario.nombre || !formulario.correo || !formulario.password || !formulario.confirmar) {
      setError('Por favor completa todos los campos.');
      return;
    }
    if (formulario.password !== formulario.confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (formulario.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    // 3. Si pasaste la función por props, la ejecutamos con los datos del formulario
    if (onRegistroExitoso) {
      onRegistroExitoso(formulario.nombre, formulario.correo, formulario.password);
    }

    navigate('/');
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px', borderRadius: '8px',
    border: '1px solid var(--border)', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box', marginBottom: '16px',
    color: 'var(--text-h)', backgroundColor: 'var(--bg)'
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'var(--bg)', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '400px', border: '1px solid var(--border)' }}>
        <h2 style={{ color: 'var(--text-h)', textAlign: 'center', marginBottom: '8px' }}>Crear cuenta</h2>
        <p style={{ color: 'var(--text)', textAlign: 'center', fontSize: '14px', marginBottom: '32px' }}>
          Únete a Estuche Virtual
        </p>
        
        {error && (
          <div style={{ backgroundColor: '#fff0f0', border: '1px solid #e74c3c', borderRadius: '8px', padding: '10px 14px', color: '#e74c3c', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text)' }}>Nombre completo</p>
        <input name="nombre" type="text" value={formulario.nombre} onChange={handleCambio} placeholder="Tu nombre completo" style={inputStyle} />
        
        <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text)' }}>Correo electrónico</p>
        <input name="correo" type="email" value={formulario.correo} onChange={handleCambio} placeholder="tucorreo@email.com" style={inputStyle} />
        
        <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text)' }}>Contraseña</p>
        <input name="password" type="password" value={formulario.password} onChange={handleCambio} placeholder="Mínimo 6 caracteres" style={inputStyle} />
        
        <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text)' }}>Confirmar contraseña</p>
        <input name="confirmar" type="password" value={formulario.confirmar} onChange={handleCambio} placeholder="Repite tu contraseña" style={inputStyle} />
        
        <button onClick={handleRegistro} style={{ backgroundColor: 'var(--accent)', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', width: '100%', marginBottom: '16px' }}>
          Crear cuenta
        </button>
        
        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text)' }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}