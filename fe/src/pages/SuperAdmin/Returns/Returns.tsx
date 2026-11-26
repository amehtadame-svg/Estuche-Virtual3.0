import { shortReference } from '../../../lib/reference';
import { useState, useEffect } from 'react';
import { API, authHeaders } from '../../../api/api';
import { runApiAction } from '../../../lib/apiAction';
import { returnStatusLabel } from '../../../lib/statusLabels';
import './Returns.css';

interface OrderReturn {
  id: string;
  orderId: string;
  quantity: number;
  reason: string;
  status: string;
  productCondition: string;
  refund: number;
  requestedAt: string;
  resolvedAt: string | null;
  customer: { fullName: string; email: string };
  product: { name: string };
  order: { id: string };
}

const statusTone: Record<string, string> = {
  requested: 'tone-warning',
  approved: 'tone-success',
  rejected: 'tone-danger',
  refunded: 'tone-info',
};

const filters: { value: string; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'requested', label: 'Solicitada' },
  { value: 'approved', label: 'Aprobada' },
  { value: 'rejected', label: 'Rechazada' },
  { value: 'refunded', label: 'Reembolsada' },
];

const emptyForm = {
  status: 'approved',
  productCondition: 'good',
  refund: '',
};

export default function Returns() {
  const [returns, setReturns] = useState<OrderReturn[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<OrderReturn | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState('all');
  const headers = authHeaders();

  const load = async () => {
    const res = await fetch(API.returns, { headers });
    if (res.ok) setReturns(await res.json());
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openModal = (d: OrderReturn) => {
    setSelected(d);
    setForm({
      status: d.status === 'requested' ? 'approved' : d.status,
      productCondition: d.productCondition,
      refund: String(d.refund ?? 0),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelected(null);
    setForm(emptyForm);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleResolve = async () => {
    if (!selected) return;
    const successMessage = selected.status === 'requested'
      ? 'Solicitud de devolución resuelta exitosamente.'
      : 'Devolución actualizada exitosamente.';
    const response = await runApiAction({
      url: `${API.returns}/${selected.id}/resolve`,
      init: {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          status: form.status,
          productCondition: form.productCondition,
          refund: Number(form.refund) || 0,
        }),
      },
      successMessage,
      errorMessage: 'No se pudieron guardar los cambios de la devolución.',
    });
    if (!response) return;
    closeModal();
    await load();
  };

  const filteredReturns = filter === 'all' ? returns : returns.filter((d) => d.status === filter);

  return (
    <>
      <div className="devoluciones-page">
        <div className="devoluciones-topbar">
          <h2 className="titulo-devoluciones">Gestión de Devoluciones</h2>
          <div className="devoluciones-filtros">
            {filters.map((f) => (
              <button
                key={f.value}
                className={`btn-filtro-dev ${filter === f.value ? 'btn-filtro-dev-activo' : ''}`}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="table-wrapper">
          <table className="tabla-devoluciones">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Motivo</th>
                <th>Estado producto</th>
                <th>Reembolso</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredReturns.length === 0 && (<tr><td colSpan={10} className="table-empty">No hay devoluciones para mostrar.</td></tr>)}
              {filteredReturns.map((d) => (
                <tr key={d.id}>
                  <td className="id-devolucion">#{shortReference(d.id)}</td>
                  <td>
                    <p className="cliente-dev-nombre">{d.customer.fullName}</p>
                    <p className="cliente-dev-email">{d.customer.email}</p>
                  </td>
                  <td className="producto-dev">{d.product.name}</td>
                  <td>{d.quantity}</td>
                  <td className="motivo-dev">{d.reason}</td>
                  <td>
                    <span className={`badge-producto-dev badge-producto-${d.productCondition}`}>{d.productCondition}</span>
                  </td>
                  <td className="reembolso-dev">{Number(d.refund) > 0 ? `$${Number(d.refund).toLocaleString()}` : '—'}</td>
                  <td>{d.requestedAt.slice(0, 10)}</td>
                  <td>
                    <span className={`badge-estado-dev ${statusTone[d.status] ?? 'tone-neutral'}`}>
                      {returnStatusLabel[d.status] ?? d.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn-resolver-dev" onClick={() => openModal(d)} disabled={d.status === 'refunded'}>
                      {d.status === 'requested' ? 'Resolver' : 'Editar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {modalOpen && selected && (
          <div className="modal-overlay-dev" onClick={closeModal}>
            <div className="modal-devoluciones" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-dev">
                <h3 className="modal-titulo-dev">Resolver devolución #{shortReference(selected.id)}</h3>
                <button className="modal-cerrar-dev" onClick={closeModal}>
                  ✕
                </button>
              </div>

              <div className="modal-body-dev">
                <div className="dev-info-card">
                  <p>
                    <strong>Cliente:</strong> {selected.customer.fullName}
                  </p>
                  <p>
                    <strong>Producto:</strong> {selected.product.name}
                  </p>
                  <p>
                    <strong>Cantidad:</strong> {selected.quantity}
                  </p>
                  <p>
                    <strong>Motivo:</strong> {selected.reason}
                  </p>
                </div>

                <p className="label-dev">Resolución</p>
                <select className="input-dev" name="status" value={form.status} onChange={handleChange}>
                  <option value="approved">Aprobar</option>
                  <option value="rejected">Rechazar</option>
                  <option value="refunded">Reembolsada</option>
                </select>

                <p className="label-dev">Estado del producto</p>
                <select className="input-dev" name="productCondition" value={form.productCondition} onChange={handleChange}>
                  <option value="good">Bueno</option>
                  <option value="damaged">Dañado</option>
                  <option value="modified">Modificado</option>
                  <option value="incomplete">Incompleto</option>
                </select>

                <p className="label-dev">Monto de reembolso</p>
                <input className="input-dev" name="refund" type="number" value={form.refund} onChange={handleChange} placeholder="0" />
              </div>

              <div className="modal-footer-dev">
                <button className="btn-cancelar-dev" onClick={closeModal}>
                  Cancelar
                </button>
                <button className="btn-guardar-dev" onClick={handleResolve}>
                  Confirmar resolución
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
