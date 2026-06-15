import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './Header.css';

export default function Header() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
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
          </>
        ) : (
          <>
            <Link to="/">Inicio</Link>
            <Link to="/catalogo">Catálogo</Link>
            <Link to="/nosotros">Nosotros</Link>
          </>
        )}
      </nav>

      <div className="header-user">
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