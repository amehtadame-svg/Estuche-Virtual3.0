import { useState, useEffect } from 'react';
import { shortReference } from '../../../lib/reference';
import { API, authHeaders } from '../../../api/api';
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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);
  const headers = authHeaders();

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(API.payouts, { headers });
      if (!res.ok) throw new Error('No se pudo cargar la lista de pagos.');
      const data: unknown = await res.json();
      if (!Array.isArray(data)) throw new Error('Respuesta inválida.');
      setPayouts(data);
      setLoadError(false);
    } catch (error) {
      setLoadError(true);
      throw error;
    } finally {
      setLoading(false);
    }
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

  const filteredPayouts = filter === 'all' ? payouts : payouts.filter((p) => p.status === filter);

  const filteredTotal = filteredPayouts.reduce((acc, p) => acc + Number(p.amount), 0);
  const currencies = new Set(filteredPayouts.map((p) => p.currency));

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


      {loadError && <p role="alert">No se pudo cargar la lista de pagos. <button type="button" onClick={() => load().catch(() => {})}>Reintentar</button></p>}
      {loading && <p role="status">Cargando pagos...</p>}
      {!loading && !loadError && <>
      <div className="pagos-resumen">
        <span className="pagos-resumen-texto">
          {filteredPayouts.length} pago{filteredPayouts.length !== 1 ? 's' : ''} —{' '}
          {currencies.size > 1 ? 'No se suman monedas diferentes' : <>
            Total de los pagos mostrados (incluye todos sus estados):{' '}
            <strong>${filteredTotal.toLocaleString()} {filteredPayouts[0]?.currency ?? ''}</strong>
          </>}
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
            </tr>
          </thead>
          <tbody>
            {filteredPayouts.length === 0 && (<tr><td colSpan={8} className="table-empty">No hay pagos para mostrar.</td></tr>)}
            {filteredPayouts.map((p) => (
              <tr key={p.id}>
                <td className="id-pago">#{shortReference(p.id)}</td>
                <td>
                  <p className="cliente-pago-nombre">{p.user.fullName}</p>
                  <p className="cliente-pago-email">{p.user.email}</p>
                </td>
                <td className="transaccion-pago">
                  <details>
                    <summary>{`PAG-${shortReference(p.transactionId)}`}</summary>
                    <span>{p.transactionId || '—'}</span>
                  </details>
                </td>
                <td>{p.gateway}</td>
                <td>{p.method ?? '—'}</td>
                <td className="monto-pago">${Number(p.amount).toLocaleString()}</td>
                <td>{p.paidAt ? p.paidAt.slice(0, 10) : '—'}</td>
                <td>
                  <span className={`badge-pago ${statusTone[p.status] ?? 'tone-neutral'}`}>
                    {paymentStatusLabel[p.status] ?? p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>}
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
