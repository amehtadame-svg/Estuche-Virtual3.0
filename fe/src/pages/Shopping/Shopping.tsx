import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Minus, Plus, ShieldCheck, ShoppingBag, ShoppingCart, Trash2, Truck } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import CategoryIcon from '../../components/ui/CategoryIcon';
import Modal from '../../components/ui/Modal';
import { productImage } from '../../lib/productImage';
import { shippingCost, FREE_SHIPPING_THRESHOLD } from '../../lib/shipping';
import { formatCOP } from '../Checkout/paymentFormat';
import './Shopping.css';

function CartImage({ name, category, imageUrl }: { name: string; category: string; imageUrl?: string | null }) {
  const [failed, setFailed] = useState(false);
  const src = productImage({ name, category: { name: category }, imageUrl });
  return <div className="carrito-item-icono">{src && !failed
    ? <img src={src} alt={name} onError={() => setFailed(true)} />
    : <CategoryIcon category={category} />}</div>;
}

export default function Shopping() {
  const { user } = useAuth();
  const { items, remove, updateQuantity, clear, total, totalItems, loading, error, reload } = useCart();
  const navigate = useNavigate();
  const [confirmClear, setConfirmClear] = useState(false);
  const shipping = shippingCost(total);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total);

  if (loading) return <main className="empty-state" role="status">Cargando tu carrito…</main>;
  if (error) return <main className="empty-state" role="alert"><h1>No pudimos cargar tu carrito</h1><p>{error}</p><button type="button" className="ui-btn ui-btn--primary" onClick={() => { void reload(); }}>Reintentar</button></main>;
  if (items.length === 0) return (
    <main className="empty-state">
      <span className="empty-state-icon" aria-hidden="true"><ShoppingCart size={34} /></span>
      <h1>Tu carrito está vacío</h1>
      <p>Encuentra ese próximo favorito para estudiar, crear o trabajar.</p>
      <Link className="ui-btn ui-btn--primary" to="/catalogo">Explorar catálogo <ArrowRight size={18} /></Link>
    </main>
  );

  return (
    <main className="carrito-container">
      <p className="carrito-crumb"><Link to="/">Inicio</Link> / Carrito</p>
      <div className="carrito-header">
        <div><span className="carrito-eyebrow">TU PRÓXIMA GRAN IDEA EMPIEZA AQUÍ</span><h1 className="carrito-titulo">Tu carrito <small>({totalItems})</small></h1><p>Revisa tus favoritos antes de continuar al pago.</p></div>
        <button type="button" className="carrito-btn-vaciar" onClick={() => setConfirmClear(true)}><Trash2 size={18} aria-hidden="true" /> Vaciar carrito</button>
      </div>
      <div className="carrito-body">
        <section aria-label="Productos del carrito">
          <div className="carrito-shipping" role="status">
            <Truck size={22} aria-hidden="true" />
            <div><strong>{remaining > 0 ? `¡Te faltan ${formatCOP(remaining)} para el envío gratis!` : '¡Tu compra ya tiene envío gratis!'}</strong><p>Envío por $10.000 · Gratis desde $120.000 en productos, antes de descuentos.</p>
              <progress max={FREE_SHIPPING_THRESHOLD} value={Math.min(total, FREE_SHIPPING_THRESHOLD)} aria-label="Progreso para envío gratis" />
            </div>
          </div>
          <div className="carrito-items">
            {items.map(item => (
              <article key={item.id} className="carrito-item">
                <Link to={`/producto/${item.id}`} aria-label={`Ver ${item.name}`}><CartImage name={item.name} category={item.category} imageUrl={item.imageUrl} /></Link>
                <div className="carrito-item-info"><Link to={`/producto/${item.id}`} className="carrito-item-nombre">{item.name}</Link><p className="carrito-item-cat">{item.category || 'Papelería'}</p><p className="carrito-item-precio-u">{formatCOP(item.price)} / unidad</p></div>
                <div className="carrito-item-cantidad" aria-label={`Cantidad de ${item.name}`}>
                  <button type="button" className="qty-btn" aria-label={`Reducir cantidad de ${item.name}`} disabled={item.quantity <= 1} onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={14} /></button>
                  <span className="qty-num" aria-live="polite">{item.quantity}</span>
                  <button type="button" className="qty-btn" aria-label={`Aumentar cantidad de ${item.name}`} disabled={item.quantity >= 999} onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={14} /></button>
                </div>
                <p className="carrito-item-subtotal">{formatCOP(item.price * item.quantity)}</p>
                <button type="button" className="carrito-item-quitar" onClick={() => remove(item.id)} aria-label={`Eliminar ${item.name}`}><Trash2 size={18} /></button>
              </article>
            ))}
          </div>
          <Link className="carrito-continue" to="/catalogo"><ShoppingBag size={17} /> Seguir explorando el catálogo</Link>
        </section>
        <aside className="carrito-resumen" aria-label="Resumen del pedido">
          <h2 className="resumen-titulo">Resumen del pedido</h2>
          <div className="resumen-lineas">
            <div className="resumen-linea"><span>Subtotal · {totalItems} unidades</span><strong>{formatCOP(total)}</strong></div>
            <div className="resumen-linea"><span>Envío a domicilio</span><strong className={shipping === 0 ? 'carrito-free' : ''}>{shipping === 0 ? 'Gratis' : formatCOP(shipping)}</strong></div>
          </div>
          <div className="resumen-total"><span>Total estimado</span><span>{formatCOP(total + shipping)}</span></div>
          <p className="carrito-summary-note">COP · Puedes aplicar tu cupón en el siguiente paso. El servidor confirma precios y disponibilidad.</p>
          <button type="button" className="resumen-btn-pagar" onClick={() => navigate(user ? '/Pago' : '/login')}>Continuar al pago <ArrowRight size={18} /></button>
          {!user && <p className="carrito-summary-note">Inicia sesión para completar la compra.</p>}
          <p className="carrito-trust"><ShieldCheck size={18} /> Compra con información protegida</p>
        </aside>
      </div>
      {confirmClear && <Modal titulo="¿Vaciar tu carrito?" onClose={() => setConfirmClear(false)} footer={<><button type="button" className="ui-btn" onClick={() => setConfirmClear(false)}>Conservar productos</button><button type="button" className="ui-btn ui-btn--primary" onClick={() => { clear(); setConfirmClear(false); }}>Sí, vaciar carrito</button></>}><p>Se eliminarán los {totalItems} productos de tu carrito. Puedes volver a agregarlos desde el catálogo.</p></Modal>}
    </main>
  );
}
