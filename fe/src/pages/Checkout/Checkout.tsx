import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, CreditCard, Landmark, MapPin, Package, ShieldCheck, ShoppingCart, Smartphone, Ticket, Truck, X } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { API, authHeaders } from '../../api/api';
import { shippingCost } from '../../lib/shipping';
import { productImage } from '../../lib/productImage';
import CategoryIcon from '../../components/ui/CategoryIcon';
import { useDemoPayment, type PaymentMethod, type Outcome, type PaymentResult } from './useDemoPayment';
import DemoPaymentResult from './DemoPaymentResult';
import { formatCOP } from './paymentFormat';
import './Checkout.css';

interface CouponQuote { code: string; subtotal: number; discountAmount: number; shippingCost: number; total: number }
const methods: { id: PaymentMethod; title: string; detail: string; Icon: typeof CreditCard }[] = [
  { id: 'tarjeta', title: 'Tarjeta', detail: 'Simulación con tarjeta. No se solicitan datos bancarios.', Icon: CreditCard },
  { id: 'nequi', title: 'Nequi', detail: 'Prueba un pago móvil sin abrir la app ni usar claves.', Icon: Smartphone },
  { id: 'pse', title: 'PSE', detail: 'Demostración del flujo bancario, sin redirigir a un banco.', Icon: Landmark },
];
function CheckoutImage({ name, category, imageUrl }: { name: string; category: string; imageUrl?: string | null }) {
  const [failed, setFailed] = useState(false);
  const image = productImage({ name, category: { name: category }, imageUrl });
  return <span className="checkout-product-image">{image && !failed ? <img src={image} alt="" onError={() => setFailed(true)} /> : <CategoryIcon category={category} />}</span>;
}
export default function Checkout() {
  const { user } = useAuth();
  const { items, total, reload, loading: cartLoading, syncing, error: cartError } = useCart();
  const navigate = useNavigate();
  const payment = useDemoPayment(user?.id);
  const { processing } = payment;
  const [method, setMethod] = useState<PaymentMethod>('tarjeta');
  const [outcome, setOutcome] = useState<Outcome>('approved');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [error, setError] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [discount, setDiscount] = useState<CouponQuote | null>(null);
  const [discountError, setDiscountError] = useState('');
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const couponRequest = useRef(Symbol());
  const cartSignature = JSON.stringify(items.map(item => [item.id, item.quantity, item.price]));
  const deliveryReady = /^3\d{9}$/.test(phone.trim()) && address.trim().length >= 5;
  const shipping = discount?.shippingCost ?? shippingCost(total);
  const subtotal = discount?.subtotal ?? total;
  const finalTotal = discount?.total ?? Math.round((total + shipping) * 100) / 100;

  useEffect(() => {
    const controller = new AbortController();
    setProfileLoading(true); setProfileError('');
    if (!user?.id) { setProfileLoading(false); return; }
    fetch(`${API.users}/${user.id}`, { headers: authHeaders(), signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error();
      return response.json();
    }).then(data => { if (!controller.signal.aborted) { setPhone(data.phone ?? ''); setAddress(data.address ?? ''); } })
      .catch(() => { if (!controller.signal.aborted) setProfileError('No pudimos cargar los datos guardados. Puedes completarlos aquí para esta compra.'); })
      .finally(() => { if (!controller.signal.aborted) setProfileLoading(false); });
    return () => controller.abort();
  }, [user?.id]);
  useEffect(() => {
    couponRequest.current = Symbol(); setDiscount(null); setDiscountError(''); setApplyingDiscount(false);
    return () => { couponRequest.current = Symbol(); };
  }, [cartSignature]);
  function clearCoupon(value = '') {
    couponRequest.current = Symbol(); setDiscountCode(value); setDiscount(null); setDiscountError(''); setApplyingDiscount(false);
  }
  async function applyDiscount() {
    if (applyingDiscount || !discountCode.trim()) return;
    const request = Symbol(); couponRequest.current = request;
    setApplyingDiscount(true); setDiscountError(''); setDiscount(null);
    try {
      const response = await fetch(`${API.promotionalCodes}/validate`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ code: discountCode.trim(), items: items.map(item => ({ productId: item.id, quantity: item.quantity })) }) });
      const data = await response.json().catch(() => ({}));
      if (request !== couponRequest.current) return;
      if (!response.ok) throw new Error(data.message || 'No se pudo validar el cupón. Intenta nuevamente.');
      if (![data.subtotal, data.discountAmount, data.shippingCost, data.total].every(value => typeof value === 'number' && Number.isFinite(value))) throw new Error('El servidor no devolvió el cálculo del cupón. Actualiza el backend y vuelve a intentar.');
      setDiscount(data);
    } catch (reason) {
      if (request === couponRequest.current) setDiscountError(reason instanceof Error && !(reason instanceof TypeError) ? reason.message : 'No pudimos conectar para validar el cupón. No se ha aplicado ningún descuento.');
    } finally { if (request === couponRequest.current) setApplyingDiscount(false); }
  }
  async function confirmPayment() {
    if (!payment.retrying && !deliveryReady) { setError('Introduce un celular colombiano de 10 dígitos que empiece por 3 y una dirección completa de al menos 5 caracteres.'); return; }
    if (!payment.retrying && discountCode.trim() && !discount) { setError('Aplica tu cupón o borra el código antes de continuar. Así no perderás el descuento sin darte cuenta.'); return; }
    setError('');
    const result = await payment.start({ method, outcome, phone: phone.trim(), address: address.trim(), ...(discount ? { code: discount.code } : {}), items: items.map(item => ({ productId: item.id, quantity: item.quantity })) });
    if (result && !(await reload())) setError('El pago se registró, pero no pudimos sincronizar el carrito. Consulta su estado antes de hacer otra compra.');
  }
  async function retryPayment() {
    setError('');
    if (!(await reload())) { setError('No se pudo recuperar el carrito. Intenta nuevamente; no se creará ningún pago.'); return; }
    if (payment.reset()) { setOutcome('approved'); clearCoupon(); }
  }
  async function syncPayment(operation: Promise<PaymentResult | null>) {
    setError('');
    if (await operation && !(await reload())) setError('El estado se consultó, pero no pudimos sincronizar el carrito. Intenta nuevamente.');
  }
  if (payment.loading) return <main className="empty-state" role="status">Consultando pagos de demostración…</main>;
  if (payment.result) return <DemoPaymentResult result={payment.result} processing={processing} error={payment.error || error} notice={payment.notice} lastCheckedAt={payment.lastCheckedAt} action={payment.action} cartSyncing={cartLoading}
    onResolve={value => { void syncPayment(payment.resolve(value)); }} onRefresh={() => { void syncPayment(payment.refresh()); }} onRetry={() => { void retryPayment(); }} onLeave={() => { if (payment.reset()) navigate('/catalogo'); }} />;
  if (cartLoading) return <main className="empty-state" role="status">Recuperando carrito…</main>;
  if (cartError) return <main className="empty-state" role="alert"><h1>Revisa tu carrito</h1><p>{cartError}</p><button className="ui-btn" onClick={() => { void reload(); }}>Reintentar</button></main>;
  if (!items.length && !payment.retrying) return <main className="empty-state"><ShoppingCart size={36} /><h1>No hay nada para pagar</h1><p>Tu carrito está vacío. Agrega productos desde el catálogo para continuar.</p><Link to="/catalogo" className="ui-btn ui-btn--primary">Ir al catálogo</Link></main>;
  return <main className="pago-container checkout-page">
    <Link className="checkout-back" to="/carrito"><ArrowLeft size={16} /> Volver al carrito</Link>
    <header className="checkout-heading"><div><p className="account-eyebrow">UN ÚLTIMO PASO PARA CREAR ALGO GRANDE</p><h1 className="pago-titulo">Finaliza tu compra</h1><p>Revisa la entrega, elige cómo pagar y confirma el resumen.</p></div><span><ShieldCheck size={18} /> Información protegida</span></header>
    <ol className="checkout-steps" aria-label="Progreso de compra"><li className={deliveryReady ? 'complete' : 'current'}>{deliveryReady ? <Check size={17} /> : <span>1</span>} Datos de entrega</li><li className="current"><span>2</span> Método de pago</li><li><span>3</span> Confirmación</li></ol>
    <div className="pago-demo-aviso" role="note"><ShieldCheck size={21} /><div><strong>Pago de demostración · Sin cobros reales</strong><p>Esta pasarela es académica. Nunca introduzcas tarjetas, claves bancarias ni códigos de Nequi.</p></div></div>
    {!payment.enabled && <p className="pago-error" role="alert">La simulación de pagos no está disponible en este entorno. Puedes revisar tu carrito o contactar con soporte.</p>}
    {payment.retrying && <p className="pago-demo-aviso">Hay un intento guardado. Se reutilizarán sus datos originales para evitar pedidos duplicados.</p>}
    <fieldset className="pago-demo-fieldset" disabled={processing || payment.retrying}>
      <legend className="pago-demo-sr-only">Datos de la compra de demostración</legend>
      <div className="pago-body">
        <div className="pago-izq">
          <section className="pago-seccion"><h2 className="pago-seccion-titulo"><MapPin size={20} /> Datos de entrega</h2><p className="checkout-help">Usaremos estos datos para tu pedido y los guardaremos en tu cuenta al confirmar.</p>
            {profileError && <p className="checkout-help" role="status">{profileError}</p>}
            <div className="checkout-delivery-fields" aria-busy={profileLoading}><label>Nombre de contacto<input value={user?.name ?? ''} readOnly autoComplete="name" /></label><label>Celular colombiano<input id="checkout-phone" type="tel" inputMode="tel" autoComplete="tel-national" maxLength={10} placeholder="3001234567" value={phone} disabled={profileLoading} onChange={event => { setPhone(event.target.value); setError(''); }} aria-describedby="checkout-phone-help" /></label><small id="checkout-phone-help">10 dígitos, comienza por 3. No incluyas +57.</small><label className="checkout-address">Dirección completa<textarea id="checkout-address" rows={3} autoComplete="street-address" maxLength={255} placeholder="Calle, número, apartamento, barrio y ciudad" value={address} disabled={profileLoading} onChange={event => { setAddress(event.target.value); setError(''); }} /></label></div>
          </section>
          <section className="pago-seccion"><h2 className="pago-seccion-titulo"><CreditCard size={20} /> ¿Cómo quieres pagar?</h2><div className="pago-metodos">{methods.map(({ id, title, detail, Icon }) => <label key={id} className={`pago-metodo-fila ${method === id ? 'seleccionado' : ''}`}><input type="radio" name="metodo" value={id} checked={method === id} onChange={() => setMethod(id)} /><Icon size={23} aria-hidden="true" /><span className="checkout-method-copy"><strong>{title}</strong><small>{detail}</small></span>{method === id && <Check size={18} className="checkout-method-check" />}</label>)}</div>
            <details className="checkout-demo-options"><summary>Opciones de la demostración</summary><label htmlFor="demo-outcome">Resultado que quieres demostrar</label><select id="demo-outcome" value={outcome} onChange={event => setOutcome(event.target.value as Outcome)}><option value="approved">Aprobado</option><option value="rejected">Rechazado</option><option value="pending">Pendiente</option></select><p>No se contactará con ningún banco ni se moverá dinero.</p></details>
          </section>
          <section className="pago-seccion"><h2 className="pago-seccion-titulo"><Package size={20} /> Tu compra · {items.reduce((sum, item) => sum + item.quantity, 0)} unidades</h2><div className="checkout-products">{items.map(item => <article key={item.id}><CheckoutImage name={item.name} category={item.category} imageUrl={item.imageUrl} /><div><strong>{item.name}</strong><small>{item.quantity} × {formatCOP(item.price)}</small></div><b>{formatCOP(item.price * item.quantity)}</b></article>)}</div></section>
        </div>
        <aside className="pago-der"><section className="pago-resumen-card"><h2 className="pago-seccion-titulo">Resumen de tu pedido</h2>
          <div className="pago-linea"><span>Productos</span><strong>{formatCOP(subtotal)}</strong></div>
          <div className="checkout-coupon"><label htmlFor="checkout-coupon"><Ticket size={17} /> ¿Tienes un cupón?</label><div className="pago-descuento-wrap"><input id="checkout-coupon" className="pago-descuento-input" placeholder="Escribe tu código" value={discountCode} onChange={event => clearCoupon(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void applyDiscount(); } }} /><button type="button" className="pago-descuento-btn" onClick={() => { void applyDiscount(); }} disabled={applyingDiscount || !discountCode.trim() || Boolean(discount) || syncing}>{applyingDiscount ? 'Validando…' : 'Aplicar'}</button></div>
            {discountError && <p className="pago-error-desc" role="alert">{discountError}</p>}
            {discount && <div className="checkout-coupon-applied" role="status"><Check size={16} /><span>{discount.code} aplicado</span><button type="button" aria-label="Quitar cupón" onClick={() => clearCoupon()}><X size={16} /></button></div>}
          </div>
          {discount && <div className="pago-linea pago-linea-descuento"><span>Descuento</span><strong>−{formatCOP(discount.discountAmount)}</strong></div>}
          <div className="pago-linea"><span>Envío a domicilio</span><strong>{shipping === 0 ? 'Gratis' : formatCOP(shipping)}</strong></div>
          <p className="checkout-shipping-note"><Truck size={17} /> $10.000 COP. Gratis desde $120.000 en productos, antes de descuentos.</p>
          <div className="pago-total"><span>Total <small>COP</small></span><strong>{formatCOP(finalTotal)}</strong></div><p className="checkout-help">El servidor confirma precios, descuento y disponibilidad al crear el pedido.</p>
          <div className="checkout-payment-choice"><ShieldCheck size={18} /><span>Simulación con <strong>{methods.find(item => item.id === method)?.title}</strong><small>No se hará ningún cobro real.</small></span></div>
        </section></aside>
      </div>
    </fieldset>
    {(error || payment.error) && <p className="pago-error" role="alert">{error || payment.error}</p>}
    <div className="pago-demo-acciones checkout-confirm-bar"><div><small>Importe de la demostración</small><strong>{payment.retrying ? 'Intento guardado' : `${formatCOP(finalTotal)} COP`}</strong></div><button type="button" className="pago-btn-confirmar" onClick={() => { void confirmPayment(); }} disabled={processing || !payment.enabled || applyingDiscount || syncing || profileLoading}>{processing ? 'Procesando simulación…' : payment.retrying ? 'Reintentar el mismo pago' : `Simular pago por ${formatCOP(finalTotal)} COP`}</button></div>
    <p className="checkout-footer-note">Al confirmar se registra un pedido de demostración. ¿Necesitas ayuda? <Link to="/cliente/pqr">Visita Ayuda y PQR</Link>.</p>
  </main>;
}
