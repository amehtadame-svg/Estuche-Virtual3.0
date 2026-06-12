import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './Header.css';

export default function Header() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();

  return (
    <header className="header">
      <div className="header-logo">
        📚 Estuche Virtual
      </div>

      <nav className="header-nav">
        <Link to="/">Inicio</Link>
        <Link to="/catalogo">Catálogo</Link>
        <Link to="/contacto">Contacto</Link>
        <Link to="/nosotros">Nosotros</Link>

        {user && (
          <Link to={user.role === 'cliente' ? '/cliente' : '/admin'}>
            Mi Panel
          </Link>
        )}
      </nav>

      <div className="header-user">
        <Link to="/carrito" className="carrito-link">
          🛒
          {totalItems > 0 && (
            <span className="carrito-badge">{totalItems}</span>
          )}
        </Link>

        {user ? (
          <>
            <span>Hola, {user.name}</span>
            <button className="logout-btn" onClick={logout}>
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
