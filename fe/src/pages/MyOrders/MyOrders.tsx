import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Package, RefreshCw, Search, ShoppingBag, Store, Truck } from 'lucide-react';
import { API, authHeaders } from '../../api/api';
import { orderStatusLabel } from '../../lib/statusLabels';
import { orderReference } from '../../lib/reference';
import { formatCOP } from '../Checkout/paymentFormat';
import AccountNav from '../../components/layout/AccountNav';
import './MyOrders.css';

interface OrderSummary {
  id: string;
  status: string;
  orderDate: string | null;
  total: number | string;
  fulfillmentMethod: 'delivery' | 'pickup';
  details?: { quantity: number; product: { name: string } | null }[];
}

export default function MyOrders() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    fetch(API.orders, { headers: authHeaders(), signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error(response.status === 401 ? 'Tu sesión venció. Vuelve a iniciar sesión.' : 'No pudimos cargar tus pedidos. Intenta de nuevo.');
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('El servidor no devolvió una lista de pedidos válida.');
        return data as OrderSummary[];
      })
      .then(data => { if (!controller.signal.aborted) setOrders(data); })
      .catch(reason => { if (!controller.signal.aborted) setError(reason instanceof TypeError ? 'No pudimos conectar con el servidor.' : reason.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);

  const filtered = orders.filter(order => (status === 'all' || order.status === status) &&
    `${orderReference(order.id)} ${order.details?.map(item => item.product?.name ?? '').join(' ')}`.toLocaleLowerCase('es').includes(search.trim().toLocaleLowerCase('es')));

  return (
    <main className="my-orders page-shell">
      <AccountNav />
      <header className="my-orders-heading"><div><p className="account-eyebrow">HISTORIAL DE COMPRAS</p><h1>Mis pedidos</h1><p>Tus compras, su preparación y su entrega, en un solo lugar.</p></div><button type="button" className="ui-btn" disabled={loading} onClick={() => setRefresh(value => value + 1)}><RefreshCw size={16} /> Actualizar</button></header>
      <div className="my-orders-tools"><label><Search size={18} /><input aria-label="Buscar pedido o producto" placeholder="Busca por referencia o producto" value={search} onChange={event => setSearch(event.target.value)} /></label><select aria-label="Filtrar por estado" value={status} onChange={event => setStatus(event.target.value)}><option value="all">Todos los estados</option>{Object.entries(orderStatusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      {loading ? <p className="my-orders-message" role="status">Cargando tus pedidos…</p> : error ? <section className="my-orders-message" role="alert"><h2>No pudimos consultar tus compras</h2><p>{error}</p><button type="button" className="ui-btn ui-btn--primary" onClick={() => setRefresh(value => value + 1)}>Reintentar</button></section> : orders.length === 0 ? <section className="my-orders-message"><ShoppingBag size={42} /><h2>Aquí comienza tu próxima idea</h2><p>Aún no has realizado pedidos. Cuando hagas tu primera compra, podrás seguirla aquí.</p><Link to="/catalogo" className="ui-btn ui-btn--primary">Explorar catálogo <ArrowRight size={16} /></Link></section> : <>
        <p className="my-orders-count" role="status">{filtered.length} pedido{filtered.length === 1 ? '' : 's'}</p>
        {filtered.length === 0 && <p className="my-orders-message">No hay pedidos con esa búsqueda o estado.</p>}
        <div className="my-orders-list">{filtered.map(order => <article className="my-order-card" key={order.id}>
          <header><div className="my-order-ref"><span className="my-order-icon"><Package size={22} /></span><div><h2>{orderReference(order.id)}</h2><p>{order.orderDate ? new Date(order.orderDate).toLocaleDateString('es-CO', { dateStyle: 'long' }) : 'Fecha no registrada'}</p></div></div><span className={`my-order-status my-order-status--${order.status}`}>{orderStatusLabel[order.status] ?? 'En revisión'}</span></header>
          <p className="my-order-products">{order.details?.length ? order.details.map(item => `${item.quantity} × ${item.product?.name ?? 'Producto no disponible'}`).join(' · ') : 'Consulta el detalle de tu compra.'}</p>
          <footer><span className="my-order-delivery">{order.fulfillmentMethod === 'pickup' ? <Store size={16} /> : <Truck size={16} />}{order.fulfillmentMethod === 'pickup' ? 'Retiro en tienda' : 'Envío a domicilio'}</span><strong>{formatCOP(order.total)} <small>COP</small></strong><Link to={`/pedidos/${order.id}`} className="ui-btn">Ver pedido <ArrowRight size={16} /></Link></footer>
        </article>)}</div>
      </>}
    </main>
  );
}
