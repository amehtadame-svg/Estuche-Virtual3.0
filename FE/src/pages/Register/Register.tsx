import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Register.css';

const Register = () => {
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPassword, setConfirm] = useState('');
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');

  const { register } = useAuth();
  const navigate     = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    const ok = await register(name.trim(), email, password);

    if (!ok) {
      setError('El correo ya está registrado o hubo un error.');
      return;
    }

    setSuccess('¡Cuenta creada! Redirigiendo...');
    setTimeout(() => navigate('/cliente'), 1500);
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h1 className="register-title">Crear cuenta</h1>
        <p className="register-subtitle">Únete a Estuche Virtual hoy</p>

        <form onSubmit={handleSubmit}>
          <label className="register-label">Nombre completo</label>
          <input className="register-input" type="text" placeholder="Tu nombre"
            value={name} onChange={e => setName(e.target.value)} required />

          <label className="register-label">Correo electrónico</label>
          <input className="register-input" type="email" placeholder="tucorreo@email.com"
            value={email} onChange={e => setEmail(e.target.value)} required />

          <label className="register-label">Contraseña</label>
          <input className="register-input" type="password" placeholder="Mínimo 6 caracteres"
            value={password} onChange={e => setPassword(e.target.value)} required />

          <label className="register-label">Confirmar contraseña</label>
          <input className="register-input" type="password" placeholder="Repite tu contraseña"
            value={confirmPassword} onChange={e => setConfirm(e.target.value)} required />

          {error   && <p className="register-error">⚠️ {error}</p>}
          {success && <p className="register-success">✅ {success}</p>}

          <button type="submit" className="register-button">Crear cuenta</button>

          <p className="register-footer">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="register-link">Inicia sesión</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;