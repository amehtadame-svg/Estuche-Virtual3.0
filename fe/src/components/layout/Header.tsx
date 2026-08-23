import { FormEvent, useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Menu,
  Moon,
  Search,
  ShoppingBag,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import "./Header.css";

const announcements = [
  "Envío gratis en pedidos superiores a $120.000",
  "Nueva colección 2026 ya disponible",
  "Devoluciones fáciles hasta 30 días",
  "Compra protegida · Pago 100% seguro",
];

export default function Header() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const isDark = localStorage.getItem("theme") === "dark";
    document.body.classList.toggle("dark-mode", isDark);
    setIsDarkMode(isDark);
  }, []);

  const toggleTheme = () => {
    const nextMode = !isDarkMode;
    document.body.classList.toggle("dark-mode", nextMode);
    localStorage.setItem("theme", nextMode ? "dark" : "light");
    setIsDarkMode(nextMode);
  };

  const closeMenu = () => setMenuOpen(false);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate(
      `/catalogo${search.trim() ? `?buscar=${encodeURIComponent(search.trim())}` : ""}`,
    );
    closeMenu();
  };

  const links =
    user?.role === "superadmin"
      ? [
          ["/superadmin", "Resumen"],
          ["/superadmin/usuarios", "Usuarios"],
          ["/superadmin/descuentos", "Descuentos"],
          ["/superadmin/pagos", "Pagos"],
          ["/superadmin/devoluciones", "Devoluciones"],
          ["/superadmin/reportes", "Reportes"],
        ]
      : user?.role === "admin"
        ? [
            ["/admin", "Resumen"],
            ["/admin/productos", "Productos"],
            ["/admin/pedidos", "Pedidos"],
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
            ["/Contacto", "Contacto"],
          ];

  return (
    <>
      <div className="announcement-bar" aria-label="Promociones">
        <div className="announcement-track">
          {[...announcements, ...announcements].map((announcement, index) => (
            <span key={`${announcement}-${index}`}>
              <i>✦</i> {announcement}
            </span>
          ))}
        </div>
      </div>

      <header className="header">
        <div className="header-inner">
          <Link
            to="/"
            className="header-logo"
            onClick={closeMenu}
            aria-label="Inicio Estuche Virtual"
          >
            <img
              src="/logo-light.png"
              alt="Estuche Virtual"
              className="logo-img logo-light"
            />
            <img
              src="/logo-dark.png"
              alt="Estuche Virtual"
              className="logo-img logo-dark"
            />
          </Link>

          <nav
            className={`header-nav ${menuOpen ? "open" : ""}`}
            aria-label="Navegación principal"
          >
            {links.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                onClick={closeMenu}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <form className="header-search" onSubmit={handleSearch}>
            <Search size={16} aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar productos"
              aria-label="Buscar productos"
            />
          </form>

          <div className={`header-actions ${menuOpen ? "open" : ""}`}>
            <button
              className="header-icon-btn"
              onClick={toggleTheme}
              aria-label={
                isDarkMode ? "Activar modo claro" : "Activar modo oscuro"
              }
            >
              {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button
              className="header-icon-btn cart-btn"
              onClick={() => {
                navigate("/carrito");
                closeMenu();
              }}
              aria-label="Ver carrito"
            >
              <ShoppingBag size={18} />
              {totalItems > 0 && (
                <span className="cart-badge">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>
            {user ? (
              <button
                className="header-profile-btn"
                onClick={() => {
                  logout();
                  navigate("/");
                  closeMenu();
                }}
                title="Cerrar sesión"
              >
                <UserRound size={16} />
                <span>Hola, {user.name.split(" ")[0]}</span>
              </button>
            ) : (
              <Link
                className="header-login-btn"
                to="/login"
                onClick={closeMenu}
              >
                Iniciar sesión
              </Link>
            )}
          </div>

          <button
            className="header-menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>
    </>
  );
}