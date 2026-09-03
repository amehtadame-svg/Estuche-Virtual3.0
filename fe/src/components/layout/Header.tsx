import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Menu,
  Moon,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sun,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import "./Header.css";

const announcements = [
  { icon: Truck, text: "Envío gratis en pedidos superiores a $120.000" },
  { icon: Sparkles, text: "Nueva colección 2026 ya disponible" },
  { icon: RotateCcw, text: "Devoluciones fáciles hasta 30 días" },
  { icon: ShieldCheck, text: "Compra protegida · Pago 100% seguro" },
];

export default function Header() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const toggleTheme = () => applyTheme(!isDarkMode);

  const closeMenu = () => setMenuOpen(false);

  const links =
    user?.role === "superadmin"
      ? [
          ["/", "Inicio"],
          ["/superadmin", "Resumen"],
          ["/superadmin/usuarios", "Usuarios"],
          ["/superadmin/descuentos", "Descuentos"],
          ["/superadmin/pagos", "Pagos"],
          ["/superadmin/devoluciones", "Devoluciones"],
          ["/superadmin/reportes", "Reportes"],
        ]
      : user?.role === "admin"
        ? [
            ["/", "Inicio"],
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
          {[...announcements, ...announcements, ...announcements].map(
            (item, index) => {
              const Icon = item.icon;
              return (
                <span key={`${item.text}-${index}`}>
                  <Icon size={13} /> {item.text}
                </span>
              );
            },
          )}
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
              className="logo-img logo-for-dark"
            />
            <img
              src="/logo-dark.png"
              alt="Estuche Virtual"
              className="logo-img logo-for-light"
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
                end={to === "/" || to === "/admin" || to === "/superadmin"}
                onClick={closeMenu}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className={`header-actions ${menuOpen ? "open" : ""}`}>
            <button
              className="header-icon-btn"
              onClick={() => {
                navigate("/catalogo");
                closeMenu();
              }}
              aria-label="Buscar productos"
            >
              <Search size={18} />
            </button>
            <button
              className="header-icon-btn theme-toggle"
              onClick={toggleTheme}
              aria-label={
                isDarkMode ? "Activar modo claro" : "Activar modo oscuro"
              }
            >
              {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
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
