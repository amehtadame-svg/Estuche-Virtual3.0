import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">

        {/* Col 1 - Logo */}
        <div className="footer-col">
          <Link to="/" className="footer-logo">📚 Estuche Virtual</Link>
          <p className="footer-desc">
            Tu tienda de útiles escolares y de oficina en línea. Calidad, variedad y entrega a domicilio en toda Colombia.
          </p>
        </div>

        {/* Col 2 - Links */}
        <div className="footer-col">
          <h4 className="footer-heading">Links rápidos</h4>
          <nav className="footer-links">
            <Link to="/">Inicio</Link>
            <Link to="/catalogo">Catálogo</Link>
            <Link to="/Nosotros">Nosotros</Link>
            <Link to="/Contacto">Contacto</Link>
          </nav>
        </div>

        {/* Col 3 - Contacto */}
        <div className="footer-col">
          <h4 className="footer-heading">Contacto</h4>
          <ul className="footer-info">
            <li>📍 Calle 45 #12-30, Bogotá</li>
            <li>📞 +57 300 123 4567</li>
            <li>✉️ hola@estuchevirtual.com</li>
            <li>⏰ Lun – Vie: 8 am – 6 pm</li>
          </ul>
        </div>

        {/* Col 4 - Redes */}
        <div className="footer-col">
          <h4 className="footer-heading">Síguenos</h4>
          <div className="footer-socials">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="social-btn">
              📸 Instagram
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="social-btn">
              👤 Facebook
            </a>
            <a
              href="https://wa.me/573204125692?text=Hola,%20quiero%20más%20información"
              target="_blank"
              rel="noreferrer"
              className="social-btn social-wa"
            >
              📱 WhatsApp
            </a>
          </div>
        </div>

      </div>

      <div className="footer-bottom">
        <p>© 2025 Estuche Virtual — Todos los derechos reservados</p>
      </div>
    </footer>
  );
}