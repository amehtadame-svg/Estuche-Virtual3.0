import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, Moon, Search, ShoppingBag, Sun, UserRound, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import "./Header.css";

export default function Header() {
  const { user } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const isStaff = user?.role === "admin" || user?.role === "superadmin";

  const applyTheme = (isDark: boolean) => {
    document.body.classList.toggle("dark-mode", isDark);
    document.documentElement.classList.toggle("dark-mode", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
    localStorage.setItem("theme", isDark ? "dark" : "light");
    setIsDarkMode(isDark);
  };

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    applyTheme(stored ? stored === "dark" : true);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => applyTheme(!isDarkMode);
  const closeMenu = () => setMenuOpen(false);

  const firstName = user?.name?.trim().split(/\s+/)[0] || "Usuario";

  const links: [string, string][] =
    user?.role === "superadmin"
      ? [
          ["/superadmin", "Resumen"],
          ["/admin/productos", "Productos"],
          ["/admin/combos", "Combos"],
          ["/admin/ingresos", "Ingresos"],
          ["/admin/salidas", "Salidas"],
          ["/admin/proveedores", "Proveedores"],
          ["/admin/pedidos", "Pedidos"],
          ["/superadmin/usuarios", "Usuarios"],
          ["/superadmin/descuentos", "Descuentos"],
          ["/superadmin/pagos", "Pagos"],
          ["/superadmin/devoluciones", "Devoluciones"],
          ["/admin/pqr", "PQR"],
          ["/superadmin/reportes", "Reportes"],
        ]
      : user?.role === "admin"
        ? [
            ["/", "Inicio"],
            ["/admin", "Resumen"],
            ["/admin/productos", "Productos"],
            ["/admin/combos", "Combos"],
            ["/admin/ingresos", "Ingresos"],
            ["/admin/salidas", "Salidas"],
            ["/admin/pedidos", "Pedidos"],
            ["/admin/pqr", "PQR"],
            ["/admin/recibos", "Recibos"],
            ["/admin/envios", "Envíos"],
            ["/admin/proveedores", "Proveedores"],
            ["/admin/usuarios", "Usuarios"],
            ["/admin/detallepedidos", "Detalle pedidos"],
          ]
        : [
            ["/", "Inicio"],
            ["/catalogo", "Catálogo"],
            ["/Nosotros", "Nosotros"],
          ];

  return (
    <header className={`header ${isStaff ? "header--staff" : ""}`}>
      <div className="header-inner">
        <Link to="/" className="header-logo" onClick={closeMenu} aria-label="Inicio Estuche Virtual">
          <img src="/logo-light.png" alt="Estuche Virtual" className="logo-img logo-for-dark" />
          <img src="/logo-dark.png" alt="Estuche Virtual" className="logo-img logo-for-light" />
        </Link>

        <nav
          className={`header-nav ${isStaff ? "header-nav--staff" : ""} ${menuOpen ? "open" : ""}`}
          aria-label="Navegación principal"
        >
          {links.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/" || to === "/admin" || to === "/superadmin"}
              onClick={closeMenu}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className={`header-actions ${menuOpen ? "open" : ""}`}>
          {!isStaff && (
            <button
              type="button"
              className="header-icon-btn"
              onClick={() => {
                navigate("/catalogo");
                closeMenu();
              }}
              aria-label="Buscar productos"
            >
              <Search size={18} />
            </button>
          )}

          <button
            type="button"
            className="header-icon-btn theme-toggle"
            onClick={toggleTheme}
            aria-label={isDarkMode ? "Activar modo claro" : "Activar modo oscuro"}
          >
            {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {!isStaff && (
            <button
              type="button"
              className="header-icon-btn cart-btn"
              onClick={() => {
                navigate("/carrito");
                closeMenu();
              }}
              aria-label="Ver carrito"
            >
              <ShoppingBag size={18} />
              {totalItems > 0 && (
                <span className="cart-badge">{totalItems > 99 ? "99+" : totalItems}</span>
              )}
            </button>
          )}

          {user ? (
            <button
              type="button"
              className="header-profile-btn"
              onClick={() => {
                navigate("/perfil");
                closeMenu();
              }}
              title="Ver mi perfil"
              aria-label={`Hola, ${firstName}. Abrir perfil`}
            >
              <UserRound size={14} aria-hidden="true" />
              <span>Hola, {firstName}</span>
            </button>
          ) : (
            <Link className="header-login-btn" to="/login" onClick={closeMenu}>
              Iniciar sesión
            </Link>
          )}
        </div>

        <button
          type="button"
          className="header-menu-toggle"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </header>
  );
}