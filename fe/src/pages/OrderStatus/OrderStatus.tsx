import AccountNav from '../../components/layout/AccountNav';
import { orderReference } from '../../lib/reference';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { API, authHeaders } from '../../api/api';
import { orderStatusLabel, receiptStatusLabel } from '../../lib/statusLabels';
import { formatCOP } from '../Checkout/paymentFormat';
import './OrderStatus.css';

interface Order {
  id: string;
  status: string;
  total: string | number;
  shippingCost?: string | number;
  orderDate: string | null;
  expiresAt: string | null;
  fulfillmentMethod: 'delivery' | 'pickup';
  deliverySnapshot: string | null;
  deliveryAddress: { address: string; city: string | null } | null;
  details: {
    id: string;
    quantity: number;
    unitPrice: string | number;
    subtotal: string | number | null;
    product: { name: string } | null;
  }[];
  receipt: {
    receiptNumber: number;
    paymentStatus: string;
    payouts: { gateway: string }[];
  } | null;
}

const descriptions: Record<string, string> = {
  pending: 'Tu pedido está registrado y pendiente de pago. Todavía no está en preparación.',
  paid: 'El pago está confirmado. Tu pedido está esperando preparación.',
  preparing: 'Estamos preparando los productos de tu pedido.',
  shipped: 'Tu pedido fue enviado y está en camino.',
  delivered: 'Tu pedido fue entregado.',
  canceled: 'El pedido está cancelado y no continuará su preparación.',
  returned: 'Se ha registrado la devolución de este pedido.',
};
const validId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function OrderStatus() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setOrder(null);
    async function load() {
      try {
        if (!id || !validId.test(id)) throw new Error('El identificador del pedido no es válido.');
        const response = await fetch(`${API.orders}/${id}`, {
          headers: authHeaders(), signal: controller.signal,
        });
        if (!response.ok) {
          const messages: Record<number, string> = {
            401: 'Tu sesión venció. Vuelve a iniciar sesión para consultar el pedido.',
            403: 'No tienes permiso para consultar este pedido.',
            404: 'No encontramos este pedido. Verifica el enlace del comprobante.',
          };
          throw new Error(messages[response.status] || 'No se pudo consultar el pedido. Intenta de nuevo.');
        }
        const data: Order = await response.json();
        if (!controller.signal.aborted) setOrder(data);
      } catch (reason) {
        if (!controller.signal.aborted) {
          setError(reason instanceof Error && !(reason instanceof TypeError)
            ? reason.message : 'No se pudo conectar con el servidor. Intenta de nuevo.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [id, refresh]);

  const simulated = order?.receipt?.payouts.some((payment) => ['demo-academica', 'simulado'].includes(payment.gateway));
  const expired = order?.status === 'pending' && order.expiresAt && new Date(order.expiresAt) <= new Date();
  const address = order?.deliverySnapshot || [order?.deliveryAddress?.address, order?.deliveryAddress?.city].filter(Boolean).join(', ');

  return (
    <main className="order-status page-shell">
      <AccountNav />
      <h1>Estado del pedido</h1>
      <p>Consulta el estado registrado de tu compra y los productos del pedido.</p>
      {loading && <p role="status">Consultando pedido…</p>}
      {error && <p className="order-status-error" role="alert">{error}</p>}
      {!loading && order && <>
        {simulated && <p className="order-status-notice"><strong>Demostración académica: sin cobros reales.</strong></p>}
        <section className="order-status-card" aria-labelledby="order-current-status">
          <h2 id="order-current-status">{orderStatusLabel[order.status] || 'Estado no disponible'}</h2>
          <p>{expired ? 'La reserva de pago venció. El pedido no admite pagos y está pendiente de la liberación automática de stock.' : descriptions[order.status] || 'Consulta con soporte para más información.'}</p>
          <dl className="order-status-facts">
            <dt>Pedido</dt><dd>{orderReference(order.id)}</dd>
            <dt>Envío</dt><dd>{Number(order.shippingCost ?? 0) === 0 ? 'Gratis' : formatCOP(order.shippingCost!)}</dd>
            <dt>Fecha del pedido</dt><dd>{order.orderDate ? new Date(order.orderDate).toLocaleString('es-CO') : 'No registrada'}</dd>
            <dt>Entrega</dt><dd>{order.fulfillmentMethod === 'pickup' ? 'Retiro en tienda' : 'Envío a domicilio'}</dd>
            {order.fulfillmentMethod !== 'pickup' && <><dt>Dirección de entrega</dt><dd>{address || 'No registrada'}</dd></>}
            {order.receipt && <>
              <dt>Recibo</dt><dd>#{order.receipt.receiptNumber}</dd>
              <dt>Estado del recibo</dt><dd>{receiptStatusLabel[order.receipt.paymentStatus] || 'No disponible'}</dd>
            </>}
          </dl>
        </section>
        <section className="order-status-card" aria-labelledby="order-products">
          <h2 id="order-products">Productos del pedido</h2>
          {order.details.length === 0 ? <p>Este pedido no tiene productos registrados.</p> : <ul className="order-status-products">
            {order.details.map((item) => <li key={item.id}>
              <span><strong>{item.product?.name || 'Producto no disponible'}</strong><br />{item.quantity} × {formatCOP(item.unitPrice)}</span>
              <span>{formatCOP(item.subtotal ?? Number(item.unitPrice) * item.quantity)}</span>
            </li>)}
          </ul>}
          <div className="order-status-total"><strong>Total del pedido</strong><strong>{formatCOP(order.total)} COP</strong></div>
          <p className="order-status-caption">El total incluye el envío y los descuentos aplicados al crear el pedido.</p>
        </section>
      </>}
      <div className="order-status-actions">
        <Link className="ui-btn" to="/mis-pedidos">Volver a mis pedidos</Link>
        <button type="button" className="ui-btn ui-btn--primary" disabled={loading} onClick={() => setRefresh((value) => value + 1)}>
          {loading ? 'Consultando…' : 'Actualizar estado'}
        </button>
      </div>
    </main>
  );
}
