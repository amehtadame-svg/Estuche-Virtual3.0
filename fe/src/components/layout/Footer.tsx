import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-orb footer-orb-one" />
      <div className="footer-orb footer-orb-two" />
      <div className="footer-grid">
        <div className="footer-brand">
          <Link to="/" className="footer-logo" aria-label="Estuche Virtual">
            <img
              className="footer-logo-light"
              src="/logo-dark.png"
              alt="Estuche Virtual"
            />
            <img
              className="footer-logo-dark"
              src="/logo-light.png"
              alt="Estuche Virtual"
            />
          </Link>
          <p>
            Todo lo que necesitas para aprender, crear y organizarte. Papelería,
            arte y oficina sin salir de casa.
          </p>
          <div className="footer-promise">
            <span>✦</span> Envíos a toda Colombia
          </div>
        </div>
        <div className="footer-col">
          <h4>Explora</h4>
          <nav>
            <Link to="/">Inicio</Link>
            <Link to="/catalogo">Catálogo</Link>
            <Link to="/Nosotros">Nosotros</Link>
            <Link to="/Contacto">Contacto</Link>
          </nav>
        </div>
        <div className="footer-col">
          <h4>Atención</h4>
          <ul>
            <li>📍 Bogotá, Colombia</li>
            <li>📞 +57 300 123 4567</li>
            <li>⏱ Lun – Vie, 8:00–18:00</li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Conecta</h4>
          <div className="footer-socials">
            <a href="https://instagram.com" target="_blank" rel="noreferrer">
              ◎ Instagram
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer">
              ● Facebook
            </a>
            <a
              href="https://wa.me/573204125692"
              target="_blank"
              rel="noreferrer"
            >
              ◉ WhatsApp
            </a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Estuche Virtual</span>
        <span>
          Hecho para acompañar tus ideas <b>✦</b>
        </span>
        <span>Todos los derechos reservados</span>
      </div>
    </footer>
  );
}