import { Link } from 'react-router-dom';
import {
  ArrowRight,
  LifeBuoy,
  LockKeyhole,
  PackageCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
  Truck,
  UserRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import './ClientDashboard.css';

interface QuickAction {
  title: string;
  description: string;
  to: string;
  icon: LucideIcon;
}

const actions: QuickAction[] = [
  { title: 'Seguir comprando', description: 'Explora el catálogo completo de útiles y papelería.', to: '/catalogo', icon: ShoppingBag },
  { title: 'Mis retiros en tienda', description: 'Consulta el estado de los pedidos que recoges en tienda.', to: '/cliente/retiros', icon: Store },
  { title: 'PQR y soporte', description: 'Envía una petición, queja o reclamo y sigue su respuesta.', to: '/cliente/pqr', icon: LifeBuoy },
  { title: 'Mi perfil', description: 'Actualiza tus datos personales y tu foto.', to: '/perfil', icon: UserRound },
];

const reasons: { icon: LucideIcon; title: string; description: string }[] = [
  { icon: Truck, title: 'Envío rápido', description: 'Recibe tus productos en la puerta de tu casa en el menor tiempo posible.' },
  { icon: Wallet, title: 'Precios justos', description: 'Precios competitivos sin sacrificar la calidad de tus útiles.' },
  { icon: LockKeyhole, title: 'Compra segura', description: 'Tu información y tus pagos están protegidos en todo momento.' },
  { icon: PackageCheck, title: 'Gran variedad', description: 'Todo para el colegio y la oficina en un solo lugar.' },
];

const ClientDashboard = () => {
  const { user } = useAuth();
  const { totalItems: cartCount } = useCart();
  const firstName = user?.name?.split(' ')[0] ?? '';

  return (
    <div className="cd-page page-shell">
      <section className="cd-hero">
        <div className="cd-hero-copy">
          <p className="cd-eyebrow">Tu cuenta</p>
          <h1>
            Hola{firstName ? `, ${firstName}` : ''}. <em>¿Qué necesitas hoy?</em>
          </h1>
          <p>Útiles escolares y de oficina al mejor precio, entregados en tu puerta o listos para recoger.</p>
          <div className="cd-hero-actions">
            <Link className="cd-btn cd-btn--primary" to="/catalogo">
              Ver productos <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link className="cd-btn cd-btn--ghost" to="/carrito">
              <ShoppingCart size={17} aria-hidden="true" />
              {cartCount > 0 ? `Carrito (${cartCount})` : 'Ir al carrito'}
            </Link>
          </div>
        </div>
      </section>

      <section className="cd-section" aria-labelledby="cd-actions-title">
        <h2 id="cd-actions-title" className="cd-section-title">Accesos rápidos</h2>
        <div className="cd-actions">
          {actions.map((action) => (
            <Link key={action.to} to={action.to} className="cd-action">
              <span className="cd-icon" aria-hidden="true">
                <action.icon size={22} />
              </span>
              <span className="cd-action-text">
                <strong>{action.title}</strong>
                <span>{action.description}</span>
              </span>
              <ArrowRight className="cd-action-arrow" size={18} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <section className="cd-section" aria-labelledby="cd-reasons-title">
        <h2 id="cd-reasons-title" className="cd-section-title">Por qué comprar con nosotros</h2>
        <div className="cd-reasons">
          {reasons.map((r) => (
            <article key={r.title} className="cd-reason">
              <span className="cd-icon" aria-hidden="true">
                <r.icon size={22} />
              </span>
              <h3>{r.title}</h3>
              <p>{r.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ClientDashboard;
