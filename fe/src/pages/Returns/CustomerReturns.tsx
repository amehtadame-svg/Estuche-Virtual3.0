import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Package, RefreshCw, Undo2 } from 'lucide-react';
import AccountNav from '../../components/layout/AccountNav';
import { API, authHeaders } from '../../api/api';
import { orderReference, shortReference } from '../../lib/reference';
import { formatCOP } from '../Checkout/paymentFormat';
import './CustomerReturns.css';

type ReturnRequest = { id: string; orderId: string; productId: string; quantity: number; reason: string; status: string; requestedAt: string | null; refund: number | string | null; product?: { name: string } | null };
type Order = { id: string; status: string; details?: { productId: string; quantity: number; product: { name: string } | null }[] };
const labels: Record<string, string> = { requested: 'Solicitud recibida', approved: 'Aprobada', rejected: 'Rechazada', refunded: 'Reembolso registrado' };
export default function CustomerReturns() {
  const [params] = useSearchParams();
  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderId, setOrderId] = useState(params.get('pedido') ?? '');
  const [order, setOrder] = useState<Order | null>(null);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sending, setSending] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const busy = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    const get = async (url: string) => {
      const response = await fetch(url, { headers: authHeaders(), signal: controller.signal });
      if (!response.ok) throw new Error('No pudimos consultar tus devoluciones y pedidos. Intenta nuevamente.');
      return response.json();
    };
    Promise.all([get(API.returns), get(API.orders)]).then(([returns, purchases]) => {
      if (!Array.isArray(returns) || !Array.isArray(purchases)) throw new Error('Respuesta del servidor no válida.');
      setRequests(returns); setOrders(purchases.filter((purchase: Order) => purchase.status === 'delivered'));
    }).catch(reason => { if (!controller.signal.aborted) setError(reason.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);
  useEffect(() => {
    setOrder(null); setProductId(''); setQuantity(1);
    if (!orderId) { setDetailLoading(false); return; }
    const controller = new AbortController(); setDetailLoading(true);
    fetch(`${API.orders}/${orderId}`, { headers: authHeaders(), signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('No pudimos cargar los productos del pedido.');
      return response.json();
    }).then(data => { if (!controller.signal.aborted) setOrder(data); })
      .catch(reason => { if (!controller.signal.aborted) setError(reason.message); })
      .finally(() => { if (!controller.signal.aborted) setDetailLoading(false); });
    return () => controller.abort();
  }, [orderId]);

  // Algunos pedidos históricos tienen varias líneas del mismo producto.
  const products = [...new Set(order?.details?.map(line => line.productId) ?? [])].map(id => ({ id,
    name: order?.details?.find(line => line.productId === id)?.product?.name ?? 'Producto no disponible',
    available: (order?.details?.filter(line => line.productId === id).reduce((sum, line) => sum + line.quantity, 0) ?? 0)
      - requests.filter(item => item.orderId === orderId && item.productId === id && item.status !== 'rejected').reduce((sum, item) => sum + item.quantity, 0),
  })).filter(product => product.available > 0);
  const maxQuantity = products.find(product => product.id === productId)?.available ?? 0;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy.current) return;
    if (!orderId || !productId || quantity < 1 || quantity > maxQuantity || reason.trim().length < 3) { setError('Selecciona un pedido, un producto, una cantidad disponible y el motivo.'); return; }
    busy.current = true; setSending(true); setError(''); setSuccess('');
    try {
      const response = await fetch(API.returns, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ orderId, productId, quantity, reason: reason.trim() }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'No se pudo registrar la devolución.');
      setSuccess(`Recibimos tu solicitud DEV-${shortReference(data.id)}. Puedes seguir su estado aquí.`);
      setReason(''); setProductId(''); setQuantity(1); setRefresh(value => value + 1);
    } catch (reason) { setError(reason instanceof TypeError ? 'No se pudo conectar. Actualiza el historial antes de reintentar para comprobar si la solicitud se registró.' : (reason as Error).message); }
    finally { busy.current = false; setSending(false); }
  }
  return <main className="customer-returns page-shell">
    <AccountNav />
    <header className="returns-heading"><div><p className="account-eyebrow">TE ACOMPAÑAMOS DESPUÉS DE TU COMPRA</p><h1>Mis devoluciones</h1><p>Solicita la revisión de un producto entregado y consulta la respuesta del equipo.</p></div><Undo2 size={32} /></header>
    {error && <div className="returns-error" role="alert">{error} <button type="button" className="ui-btn" disabled={loading} onClick={() => setRefresh(value => value + 1)}>Reintentar</button></div>}
    {success && <p className="returns-success" role="status">{success}</p>}
    <div className="returns-layout">
      <section className="returns-card"><h2>Solicitar una devolución</h2><p>Solo aparecen tus pedidos entregados. La solicitud no supone un reembolso automático: el equipo debe revisarla.</p>
        {loading ? <p role="status">Cargando pedidos…</p> : !orders.length ? <div className="returns-empty"><Package size={30} /><p>Aún no tienes pedidos entregados para devolver.</p><Link to="/mis-pedidos">Ver mis pedidos</Link></div> : <form onSubmit={submit} aria-busy={sending}>
          <fieldset disabled={sending}><label>Pedido<select required value={orderId} onChange={event => { setOrderId(event.target.value); setError(''); }}><option value="">Selecciona un pedido entregado</option>{orders.map(purchase => <option value={purchase.id} key={purchase.id}>{orderReference(purchase.id)}</option>)}</select></label>
          <label>Producto<select required disabled={!order || detailLoading} value={productId} onChange={event => { setProductId(event.target.value); setQuantity(1); }}><option value="">{detailLoading ? 'Cargando productos…' : 'Selecciona un producto'}</option>{products.map(product => <option key={product.id} value={product.id}>{product.name} · {product.available} disponibles para devolver</option>)}</select></label>
          {order && products.length === 0 && <p>Ya se solicitaron las unidades disponibles de este pedido.</p>}
          <label>Cantidad<input type="number" min={1} max={maxQuantity || 1} required value={quantity} onChange={event => setQuantity(Number(event.target.value))} /></label>
          <label>Motivo<textarea required minLength={3} maxLength={500} rows={4} placeholder="Cuéntanos qué ocurrió con el producto" value={reason} onChange={event => setReason(event.target.value)} /></label><small>{reason.length}/500 caracteres</small>
          <button className="ui-btn ui-btn--primary" type="submit" disabled={!productId || detailLoading}>{sending ? 'Enviando solicitud…' : 'Enviar solicitud'}</button></fieldset>
        </form>}
      </section>
      <section className="returns-card"><div className="returns-history-heading"><h2>Historial de solicitudes</h2><button type="button" className="ui-btn" aria-label="Actualizar devoluciones" disabled={loading || sending} onClick={() => setRefresh(value => value + 1)}><RefreshCw size={16} /></button></div>
        {loading ? <p role="status">Consultando solicitudes…</p> : !requests.length ? <p className="returns-empty">Todavía no has solicitado devoluciones.</p> : <div className="returns-history">{requests.map(item => <article key={item.id}><div><strong>DEV-{shortReference(item.id)}</strong><span className={`returns-status returns-status--${item.status}`}>{labels[item.status] ?? 'En revisión'}</span></div><h3>{item.product?.name ?? 'Producto'}</h3><p>{item.quantity} unidad(es) · <Link to={`/pedidos/${item.orderId}`}>{orderReference(item.orderId)}</Link></p><p>{item.reason}</p>{item.requestedAt && <time dateTime={item.requestedAt}>{new Date(item.requestedAt).toLocaleDateString('es-CO')}</time>}{item.status === 'refunded' && <p>Reembolso registrado: <strong>{formatCOP(item.refund ?? 0)}</strong></p>}</article>)}</div>}
      </section>
    </div>
  </main>;
}
