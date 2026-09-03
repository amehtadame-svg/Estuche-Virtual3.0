import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, PenLine, Phone, Send } from "lucide-react";
import "./Footer.css";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSent(true);
  };

  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <Link to="/" className="footer-logo" aria-label="Estuche Virtual">
            <span className="footer-mark">
              <PenLine size={18} />
            </span>
            <span className="footer-word">
              Estuche <em>Virtual</em>
            </span>
          </Link>
          <p>
            Papelería, arte y oficina con curaduría premium. Todo lo que
            necesitas, en un solo lugar.
          </p>
          <div className="footer-socials">
            <a href="https://instagram.com" target="_blank" rel="noreferrer">
              Ig
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer">
              Fb
            </a>
            <a
              href="https://wa.me/576017458890"
              target="_blank"
              rel="noreferrer"
            >
              Wa
            </a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Tienda</h4>
          <nav>
            <Link to="/catalogo">Catálogo completo</Link>
            <Link to="/catalogo?cat=Cuadernos">Cuadernos</Link>
            <Link to="/catalogo?cat=Arte">Arte y dibujo</Link>
            <Link to="/catalogo?cat=Mochilas">Mochilas</Link>
            <Link to="/catalogo?oferta=1">Ofertas</Link>
          </nav>
        </div>

        <div className="footer-col">
          <h4>Soporte</h4>
          <nav>
            <Link to="/Contacto">Contáctanos</Link>
            <Link to="/cliente">Seguimiento de envíos</Link>
            <Link to="/Contacto">Devoluciones</Link>
            <Link to="/Contacto">Preguntas frecuentes</Link>
            <Link to="/Nosotros">Nosotros</Link>
          </nav>
        </div>

        <div className="footer-col footer-news">
          <h4>Novedades</h4>
          <p>Recibe lanzamientos y cupones exclusivos.</p>
          <form onSubmit={onSubmit}>
            <input
              type="email"
              required
              placeholder="tu@correo.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <button type="submit" aria-label="Enviar">
              <Send size={14} />
            </button>
          </form>
          {sent && <small>Cupón BIENVENIDA10 listo.</small>}
          <ul>
            <li>Calle 45 #12-30, Bogotá</li>
            <li>
              <Phone size={14} /> +57 601 745 8890
            </li>
            <li>
              <Mail size={14} /> hola@estuchevirtual.co
            </li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Estuche Virtual · Hecho con ♥ en Colombia</span>
        <div className="footer-pays">
          <b>VISA</b>
          <b>Mastercard</b>
          <b>PSE</b>
          <b>Nequi</b>
          <b>Addi</b>
          <b>Efecty</b>
        </div>
      </div>
    </footer>
  );
}
