import { useState, useEffect } from 'react';
import { API, authHeaders } from '../../../api/api';
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

const statusColor: Record<string, string> = {
  pending: '#f59e0b',
  approved: '#10b981',
  rejected: '#e74c3c',
  refunded: '#3b82f6',
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
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all');
  const headers = authHeaders();

  const showMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 2500);
  };

  const load = async () => {
    const res = await fetch(API.payouts, { headers });
    if (res.ok) setPayouts(await res.json());
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStatus = async (id: string, status: string) => {
    const res = await fetch(`${API.payouts}/${id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      showMessage('Estado actualizado.');
      load();
    }
  };

  const filteredPayouts = filter === 'all' ? payouts : payouts.filter((p) => p.status === filter);

  const filteredTotal = filteredPayouts.reduce((acc, p) => acc + Number(p.amount), 0);

  return (
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

      {message && <div className="mensaje-pagos">{message}</div>}

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
            {filteredPayouts.map((p) => (
              <tr key={p.id}>
                <td className="id-pago">#{p.id.slice(0, 6).toUpperCase()}</td>
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
                  <span className="badge-pago" style={{ backgroundColor: statusColor[p.status] ?? '#999' }}>
                    {paymentStatusLabel[p.status] ?? p.status}
                  </span>
                </td>
                <td>
                  <select
                    className="select-estado-pago"
                    value={p.status}
                    onChange={(e) => handleStatus(p.id, e.target.value)}
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
  );
}
