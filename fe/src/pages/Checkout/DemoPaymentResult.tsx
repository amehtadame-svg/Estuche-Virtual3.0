import { shortReference, orderReference } from '../../lib/reference';
import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock3, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { isPaymentClosed, type PaymentAction, type PaymentResult } from './useDemoPayment';
import { formatCOP } from './paymentFormat';
import './PaymentResult.css';

interface Props {
  result: PaymentResult;
  processing: boolean;
  error: string;
  notice?: string;
  lastCheckedAt?: Date | null;
  action?: PaymentAction;
  cartSyncing?: boolean;
  onResolve: (outcome: 'approved' | 'rejected') => void;
  onRefresh: () => void;
  onRetry?: () => void;
  onLeave: () => void;
}

export default function DemoPaymentResult({ result, processing, error, notice = '', lastCheckedAt,
  action = null, cartSyncing = false, onResolve, onRefresh, onRetry, onLeave }: Props) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const pending = result.status === 'pending';
  const closed = isPaymentClosed(result, now);
  const expired = pending && closed;
  const state = expired ? 'expired' : result.status;
  const disabled = processing || cartSyncing;
  const title = result.status === 'approved' ? 'Tu pago fue aprobado'
    : result.status === 'rejected' ? 'El pago fue rechazado'
      : expired ? 'La reserva ya no está disponible' : 'Tu pago está pendiente';
  const description = result.status === 'approved'
    ? 'El pedido está confirmado dentro de la demostración. Puedes consultar su preparación y entrega.'
    : result.status === 'rejected'
      ? 'No se realizó ningún cobro. Devolvimos el stock y los productos a tu carrito para que puedas probar de nuevo.'
      : expired ? 'Este pedido ya no admite pagos. Puedes volver al catálogo e iniciar una compra nueva; el stock vencido se libera automáticamente.'
        : 'Los productos están reservados durante 30 minutos. En esta demostración puedes elegir cómo finaliza el pago.';
  return (
    <main className={`payment-result payment-result--${state}`}>
      <div className="payment-result-mode"><ShieldCheck size={16} aria-hidden="true" /> Demostración académica · Sin cobros reales</div>
      <section className="payment-result-card" aria-labelledby="payment-result-title">
        <header className="payment-result-header">
          <span className="payment-result-icon" aria-hidden="true">
            {result.status === 'approved' ? <CheckCircle2 size={36} /> : expired || result.status === 'rejected' ? <XCircle size={36} /> : <Clock3 size={36} />}
          </span>
          <div><p className="payment-result-eyebrow">Resultado del pago simulado</p><h1 id="payment-result-title">{title}</h1></div>
        </header>
        <p className="payment-result-description">{description}</p>
        <div className="payment-result-amount"><span>Importe de la compra</span><strong>{formatCOP(result.amount)} <small>COP</small></strong></div>
        <dl className="payment-result-details">
          <div><dt>Método de pago</dt><dd>{result.method === 'pse' ? 'PSE' : result.method === 'nequi' ? 'Nequi' : 'Tarjeta'}</dd></div>
          <div><dt>Envío</dt><dd>{Number(result.shippingCost ?? 0) === 0 ? 'Gratis' : formatCOP(result.shippingCost!)}</dd></div>
          <div><dt>Recibo de demostración</dt><dd>#{result.receiptNumber}</dd></div>
          {result.expiresAt && <div><dt>Reserva hasta</dt><dd>{new Date(result.expiresAt).toLocaleString('es-CO')}</dd></div>}
          <div className="payment-result-wide"><dt>Referencia del pago</dt><dd>{`PAG-${shortReference(result.reference)}`}</dd></div>
          <div className="payment-result-wide"><dt>Número de pedido</dt><dd>{orderReference(result.orderId)}</dd></div>
        </dl>
        {error && <p className="payment-result-error" role="alert">{error}</p>}
        {notice && <p className="payment-result-notice" role="status">{notice}</p>}
        <div className="payment-result-refresh">
          <div>
            <button type="button" className="payment-result-button payment-result-button--secondary" disabled={disabled} onClick={onRefresh}>
              <RefreshCw size={16} className={action === 'refresh' ? 'payment-result-spinning' : ''} aria-hidden="true" />
              {action === 'refresh' ? 'Consultando pago…' : 'Consultar estado del pago'}
            </button>
            {lastCheckedAt && <p>Última consulta: {lastCheckedAt.toLocaleTimeString('es-CO')}</p>}
          </div>
          <p>Consultar comprueba el estado en el servidor. No aprueba ni rechaza el pago.</p>
        </div>
        {pending && !closed && <section className="payment-result-simulator" aria-label="Controles de simulación">
          <h2>Completar la demostración</h2>
          <p>Elige un resultado de prueba. No se contactará con tu banco.</p>
          <div className="payment-result-actions">
            <button type="button" className="payment-result-button payment-result-button--secondary" disabled={disabled} onClick={() => onResolve('rejected')}>Simular rechazo</button>
            <button type="button" className="payment-result-button payment-result-button--primary" disabled={disabled} onClick={() => onResolve('approved')}>{action === 'resolve' ? 'Registrando resultado…' : 'Simular aprobación'}</button>
          </div>
        </section>}
        <footer className="payment-result-actions payment-result-footer">
          <Link className="payment-result-button payment-result-button--secondary" to={`/pedidos/${encodeURIComponent(result.orderId)}`}>Ver estado del pedido</Link>
          {closed && <button type="button" className="payment-result-button payment-result-button--primary" disabled={disabled} onClick={result.status === 'rejected' && onRetry ? onRetry : onLeave}>
            {cartSyncing ? 'Recuperando carrito…' : result.status === 'rejected' ? 'Reintentar pago' : 'Volver al catálogo'}<ArrowRight size={16} aria-hidden="true" />
          </button>}
        </footer>
      </section>
      <p className="payment-result-disclaimer">Este comprobante es de prueba. No representa una transacción financiera ni una integración oficial con PSE o Nequi.</p>
    </main>
  );
}
