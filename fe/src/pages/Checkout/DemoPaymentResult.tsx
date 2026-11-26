import { CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PaymentResult } from './useDemoPayment';

import { formatCOP } from './paymentFormat';

interface Props {
  result: PaymentResult;
  processing: boolean;
  error: string;
  onResolve: (outcome: 'approved' | 'rejected') => void;
  onRefresh: () => void;
  onLeave: () => void;
}

export default function DemoPaymentResult({ result, processing, error, onResolve, onRefresh, onLeave }: Props) {
  const pending = result.status === 'pending';
  const expired = result.orderStatus === 'canceled' || (result.expiresAt !== null && new Date(result.expiresAt) <= new Date());
  const title = result.status === 'approved' ? 'Pago simulado aprobado'
    : result.status === 'rejected' ? 'Pago simulado rechazado'
      : expired ? 'Reserva vencida o cancelada' : 'Pago simulado pendiente';
  return (
    <main className="pago-exito" aria-live="polite">
      <p className="pago-demo-badge">DEMOSTRACIÓN ACADÉMICA · SIN COBROS REALES</p>
      <div className="pago-exito-icono" aria-hidden="true">
        {result.status === 'approved' ? <CheckCircle2 size={56} /> : pending ? <Clock3 size={56} /> : <XCircle size={56} />}
      </div>
      <h1>{title}</h1>
      <p>{result.status === 'approved'
        ? 'El pedido y el recibo quedaron pagados dentro de la demostración. No se movió dinero real.'
        : result.status === 'rejected'
          ? 'El pedido se canceló y el stock se devolvió al inventario. Puedes realizar otra compra de prueba.'
          : 'No está pagado. La reserva dura 30 minutos; puedes simular su aprobación o rechazo mientras esté vigente.'}</p>
      <dl className="pago-demo-detalles">
        <dt>Importe</dt><dd>{formatCOP(result.amount)} COP</dd>
        <dt>Envío</dt><dd>Gratis</dd>
        <dt>Método</dt><dd>{result.method === 'pse' ? 'PSE' : result.method === 'nequi' ? 'Nequi' : 'Tarjeta'}</dd>
        <dt>Referencia</dt><dd>{result.reference}</dd>
        <dt>Pedido</dt><dd>{result.orderId}</dd>
        <dt>Recibo de demostración</dt><dd>#{result.receiptNumber}</dd>
        {result.expiresAt && <><dt>Reserva hasta</dt><dd>{new Date(result.expiresAt).toLocaleString('es-CO')}</dd></>}
      </dl>
      {error && <p className="pago-error" role="alert">{error}</p>}
      {pending && !expired && <div className="pago-demo-acciones">
        <button className="pago-btn-secundario" disabled={processing} onClick={() => onResolve('rejected')}>Simular rechazo</button>
        <button className="pago-btn-confirmar" disabled={processing} onClick={() => onResolve('approved')}>Simular aprobación</button>
      </div>}
      <div className="pago-demo-acciones">
        <Link className="ui-btn ui-btn--primary" to={`/pedidos/${encodeURIComponent(result.orderId)}`}>Ver estado del pedido</Link>
        <button className="pago-btn-secundario" disabled={processing} onClick={onRefresh}>Consultar estado del pago</button>
        {(!pending || expired) && <button className="pago-btn-confirmar" disabled={processing} onClick={onLeave}>Volver al catálogo</button>}
      </div>
      <p className="pago-seguro">No es un comprobante de una entidad financiera ni una integración oficial con PSE o Nequi.</p>
    </main>
  );
}
