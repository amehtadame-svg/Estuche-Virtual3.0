import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './Header.css';

export default function Header() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') {
      document.body.classList.add('dark-mode');
      setIsDarkMode(true);
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
        📚 Estuche Virtual
      </Link>
    
      <nav className="header-nav">
        {user?.role === 'administrador' ? (
          <>
            <Link to="/admin">Inicio</Link>
            <Link to="/admin/productos">Productos</Link>
            <Link to="/admin/pedidos">Pedidos</Link>
            <Link to="/admin/facturas">Facturas</Link>
            <Link to="/admin/envios">Envíos</Link>
            <Link to="/admin/proveedores">Proveedores</Link>
            <Link to="/admin/usuarios">Usuarios</Link>
            <Link to="/admin/DetalleFactura">DetalleFactura</Link>
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
          <Link to="/carrito" className="carrito-link">
            🛒
            {totalItems > 0 && (
              <span className="carrito-badge">{totalItems}</span>
            )}
          </Link>
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