import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Header.css';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
      document.body.classList.remove('dark-mode');
      setIsDarkMode(false);
    } else {
      document.body.classList.add('dark-mode');
      setIsDarkMode(true);
      localStorage.setItem('theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextMode = !isDarkMode;
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', nextMode ? 'dark' : 'light');
    setIsDarkMode(nextMode);
  };

  return (
    <header className="header">
      <Link to="/" className="header-logo">
        <img src="/logo.png" alt="Estuche Virtual" className="logo-img logo_estuche_limpio" />
        <img src="/logo-dark.png" alt="Estuche Virtual" className="logo-img logo-dark" />
      </Link>

      <nav className="header-nav">
        {user?.role === 'superadmin' ? (
          <>
            <Link to="/superadmin">Inicio</Link>
            <Link to="/superadmin/usuarios">Usuarios</Link>
            <Link to="/superadmin/descuentos">Descuentos</Link>
            <Link to="/superadmin/pagos">Pagos</Link>
            <Link to="/superadmin/devoluciones">Devoluciones</Link>
            <Link to="/superadmin/reportes">Reportes</Link>
          </>
        ) : user?.role === 'administrador' ? (
          <>
            <Link to="/admin">Inicio</Link>
            <Link to="/admin/productos">Productos</Link>
            <Link to="/admin/pedidos">Pedidos</Link>
            <Link to="/admin/facturas">Facturas</Link>
            <Link to="/admin/envios">Envíos</Link>
            <Link to="/admin/proveedores">Proveedores</Link>
            <Link to="/admin/usuarios">Usuarios</Link>
            <Link to="/admin/detallepedidos">DetallePedidos</Link>
          </>
        ) : (
          <>
            <Link to="/">Inicio</Link>
            <Link to="/catalogo">Catálogo</Link>
          </>
        )}
      </nav>

      <div className="header-user">
        <button className="theme-toggle-btn" onClick={toggleTheme}>
          {isDarkMode ? '🌙' : '☀️'}
        </button>

        {user?.role !== 'administrador' && (
          <button className="cart-btn" onClick={() => navigate('/carrito')}>
            🛒
          </button>
        )}

        {user ? (
          <>
            <span>Hola, {user.name}</span>
            <button className="logout-btn" onClick={() => { logout(); navigate('/'); }}>
              Salir
            </button>
          </>
        ) : (
          <Link className="login-btn" to="/login">
            Iniciar sesión
          </Link>
        )}
      </div>
    </header>
  );
}