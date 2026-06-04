import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import './AppLayout.css';

const enlaces = [
  { to: '/', label: 'Inicio' },
  { to: '/nosotros', label: 'Nosotros' },
  { to: '/productos', label: 'Productos' },
  { to: '/carrito', label: '🛒 Carrito' },
  { to: '/contacto', label: 'Contacto' },
  { to: '/usuarios', label: 'Usuarios' },
  { to: '/administradores', label: 'Administradores' },
  { to: '/pedidos', label: 'Pedidos' },
  { to: '/facturas', label: 'Facturas' },
  { to: '/detalle-facturas', label: 'Detalle Facturas' },
  { to: '/envios', label: 'Envios' },
  { to: '/proveedores', label: 'Proveedores' },
  { to: '/login', label: 'Login' },
  { to: '/registro', label: 'Registro' },
];

export default function AppLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className="app-layout">
      <header className="navbar">
        <span className="navbar-brand">Estuche Virtual</span>
        <button
          className="menu-toggle"
          onClick={() => setMenuAbierto(!menuAbierto)}
        >
          {menuAbierto ? '✕' : '☰'}
        </button>
        <nav className={`navbar-links ${menuAbierto ? 'open' : ''}`}>
          {enlaces.map((e) => (
            <NavLink
              key={e.to}
              to={e.to}
              end={e.to === '/'}
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              onClick={() => setMenuAbierto(false)}
            >
              {e.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="contenido">
        <Outlet />
      </main>
    </div>
  );
}
