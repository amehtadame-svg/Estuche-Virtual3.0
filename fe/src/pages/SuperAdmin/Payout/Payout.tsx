import { useState, useEffect, useRef } from 'react';
import { API, authHeaders } from '../../../api/api';
import { notify } from '../../../lib/notifications';
import '../../../components/ui/ToastProvider.css';
import { paymentStatusLabel } from '../../../lib/statusLabels';
import './Payout.css';

interface Payout {
  id: string;
  receiptId: string;
  gateway: string;
  transactionId: string;
  status: string;
  method: string | null;
  amount: number;
  currency: string;
  paidAt: string;
  confirmedAt: string | null;
  user: { fullName: string; email: string };
  receipt: { receiptNumber: number; total: number };
}

const statusTone: Record<string, string> = {
  pending: 'tone-warning',
  approved: 'tone-success',
  rejected: 'tone-danger',
  refunded: 'tone-info',
};

const filters: { value: string; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'approved', label: 'Aprobado' },
  { value: 'rejected', label: 'Rechazado' },
  { value: 'refunded', label: 'Reembolsado' },
];

export default function Payout() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [filter, setFilter] = useState('all');
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);
  const pending = useRef(new Set<string>());
  const headers = authHeaders();

  const load = async () => {
    const res = await fetch(API.payouts, { headers });
    if (!res.ok) throw new Error('No se pudo cargar la lista de pagos.');
    setPayouts(await res.json());
  };

  useEffect(() => {
    load().catch(() => setNotice({ title: 'No se cargaron los pagos', message: 'Revisa la conexión y vuelve a abrir la sección.' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const handleStatus = async (payment: Payout, status: string) => {
    if (pending.current.has(payment.id) || status === payment.status) return;
    if (payment.status !== 'pending' || !['approved', 'rejected'].includes(status)) {
      const message = status === 'refunded'
        ? 'Este sistema aún no procesa reembolsos. No se devolvió dinero ni se modificó el pago.'
        : payment.status === 'approved'
          ? 'El pago ya está aprobado. No se puede volver a pendiente o rechazado desde este selector; cambiar la etiqueta no revierte el dinero ni el pedido.'
          : 'Solo los pagos pendientes se pueden aprobar o rechazar desde este selector. Los demás cambios requieren revisión financiera.';
      setNotice({ title: 'No se cambió el pago', message });
      return;
    }
    pending.current.add(payment.id);
    try {
      const response = await fetch(`${API.payouts}/${payment.id}/status`, {
        method: 'PATCH', headers, body: JSON.stringify({ status }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        const raw = typeof result?.message === 'string' ? result.message : '';
        setNotice({
          title: 'No se cambió el pago',
          message: raw.toLowerCase().includes('transición financiera no permitida')
            ? 'El pago cambió o ya no permite esta transición. Actualiza la lista y revisa su estado.'
            : raw || 'No se pudo actualizar el pago. Revisa su estado antes de volver a intentarlo.',
        });
        return;
      }
      notify.success(
        status === 'approved'
          ? 'El pago se registró como aprobado. Si completa el total, el pedido se actualiza a Pagado.'
          : 'El pago se registró como rechazado. No se confirmó este pago.',
        'Cambios guardados'
      );
      await load().catch(() => setNotice({ title: 'Pago guardado', message: 'El servidor confirmó el cambio, pero no se pudo actualizar la lista. Vuelve a abrir Pagos para revisarla.' }));
    } catch {
      setNotice({ title: 'No se pudo confirmar el pago', message: 'Revisa el estado del pago y del pedido antes de intentarlo de nuevo.' });
    } finally {
      pending.current.delete(payment.id);
    }
  };

  const filteredPayouts = filter === 'all' ? payouts : payouts.filter((p) => p.status === filter);

  const filteredTotal = filteredPayouts.reduce((acc, p) => acc + Number(p.amount), 0);

  return (
    <>
    <div className="pagos-page">
      <div className="pagos-topbar">
        <h2 className="titulo-pagos">Gestión de Pagos</h2>
        <div className="pagos-filtros">
          {filters.map((f) => (
            <button
              key={f.value}
              className={`btn-filtro-pago ${filter === f.value ? 'btn-filtro-activo' : ''}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>


      <div className="pagos-resumen">
        <span className="pagos-resumen-texto">
          {filteredPayouts.length} pago{filteredPayouts.length !== 1 ? 's' : ''} — Total:{' '}
          <strong>${filteredTotal.toLocaleString()}</strong>
        </span>
      </div>

      <div className="table-wrapper">
        <table className="tabla-pagos">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Transacción</th>
              <th>Pasarela</th>
              <th>Método</th>
              <th>Monto</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayouts.length === 0 && (<tr><td colSpan={9} className="table-empty">No hay pagos para mostrar.</td></tr>)}
            {filteredPayouts.map((p) => (
              <tr key={p.id}>
                <td className="id-pago">#{p.id.slice(-6).toUpperCase()}</td>
                <td>
                  <p className="cliente-pago-nombre">{p.user.fullName}</p>
                  <p className="cliente-pago-email">{p.user.email}</p>
                </td>
                <td className="transaccion-pago">{p.transactionId}</td>
                <td>{p.gateway}</td>
                <td>{p.method ?? '—'}</td>
                <td className="monto-pago">${Number(p.amount).toLocaleString()}</td>
                <td>{p.paidAt ? p.paidAt.slice(0, 10) : '—'}</td>
                <td>
                  <span className={`badge-pago ${statusTone[p.status] ?? 'tone-neutral'}`}>
                    {paymentStatusLabel[p.status] ?? p.status}
                  </span>
                </td>
                <td>
                  <select
                    className="select-estado-pago"
                    value={p.status}
                    onChange={(e) => handleStatus(p, e.target.value)}
                  >
                    <option value="pending">Pendiente</option>
                    <option value="approved">Aprobado</option>
                    <option value="rejected">Rechazado</option>
                    <option value="refunded">Reembolsado</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    {notice && (
      <div className="success-notice-overlay notificaciones-superadmin">
        <section className="confirm-delete-dialog success-notice-dialog" role="alert" aria-live="assertive">
          <header className="confirm-delete-header">
            <span className="success-notice-icon" aria-hidden="true">!</span>
            <h2>{notice.title}</h2>
            <button type="button" className="confirm-delete-close" aria-label="Cerrar notificación" onClick={() => setNotice(null)}>×</button>
          </header>
          <div className="confirm-delete-body success-notice-body"><p className="success-notice-message">{notice.message}</p></div>
        </section>
      </div>
    )}
    </>
  );
}
