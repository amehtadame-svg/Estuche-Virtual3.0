import { shortReference } from '../../../lib/reference';
import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import { API, authHeaders } from '../../../api/api';
import { notify } from '../../../lib/notifications';
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

const conditionLabels: Record<string, string> = { good: 'Bueno', damaged: 'Dañado', modified: 'Modificado', incomplete: 'Incompleto' };

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

interface ReturnOrder {
  id: string;
  status: string;
  customer: { fullName: string } | null;
  details: { productId: string; quantity: number; product: { name: string } }[];
}

export default function Returns() {
  const [orders, setOrders] = useState<ReturnOrder[]>([]);
  const [creating, setCreating] = useState(false);
  const [newReturn, setNewReturn] = useState({ orderId: '', productId: '', quantity: '1', reason: '' });
  const [saving, setSaving] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [returns, setReturns] = useState<OrderReturn[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<OrderReturn | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState('all');
  const headers = authHeaders();

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(API.returns, { headers });
      if (!res.ok) throw new Error();
      const data: unknown = await res.json();
      if (!Array.isArray(data)) throw new Error();
      setReturns(data);
      setLoadError(false);
    } catch { setLoadError(true); } finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    fetch(API.orders, { headers }).then(r => {
      if (!r.ok) throw new Error();
      return r.json();
    }).then(data => {
      if (Array.isArray(data)) setOrders(data.filter((order: ReturnOrder) => order.status === 'delivered'));
    }).catch(() => notify.error('No se pudieron cargar los pedidos para la devolución.'));
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
    if (!selected || resolving) return;
    if (form.refund.trim() === '' || !Number.isFinite(Number(form.refund)) || Number(form.refund) < 0) {
      notify.error('Ingresa un monto de reembolso válido, igual o mayor que cero.');
      return;
    }
    setResolving(true);
    try {
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
    } finally { setResolving(false); }
  };

  const createReturn = async () => {
    if (!newReturn.orderId || !newReturn.productId || !Number.isInteger(Number(newReturn.quantity)) || Number(newReturn.quantity) < 1 || newReturn.reason.trim().length < 3) {
      notify.error('Selecciona pedido y producto, una cantidad válida y un motivo de al menos 3 caracteres.');
      return;
    }
    const selectedDetail = orders.find(order => order.id === newReturn.orderId)?.details.filter(detail => detail.productId === newReturn.productId);
    const purchased = selectedDetail?.reduce((sum, detail) => sum + detail.quantity, 0) ?? 0;
    if (Number(newReturn.quantity) > purchased) {
      notify.error('La cantidad no puede superar las unidades compradas.');
      return;
    }
    setSaving(true);
    try {
      const response = await runApiAction({
        url: API.returns,
        init: { method: 'POST', headers, body: JSON.stringify({ ...newReturn, quantity: Number(newReturn.quantity), reason: newReturn.reason.trim() }) },
        successMessage: 'Solicitud de devolución registrada.',
        errorMessage: 'No se pudo registrar la devolución.',
      });
      if (response) { setCreating(false); setNewReturn({ orderId: '', productId: '', quantity: '1', reason: '' }); await load(); }
    } finally { setSaving(false); }
  };
  const selectedOrder = orders.find(order => order.id === newReturn.orderId);

  const filteredReturns = filter === 'all' ? returns : returns.filter((d) => d.status === filter);

  return (
    <>
      <div className="devoluciones-page">
        <div className="devoluciones-topbar">
          <h2 className="titulo-devoluciones">Gestión de Devoluciones</h2>
          <button className="btn-guardar-dev" onClick={() => setCreating(true)}>+ Nueva devolución</button>
        </div>
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

        {loading && <p role="status">Cargando devoluciones...</p>}
        {loadError && <p role="alert">No se pudieron cargar las devoluciones. <button type="button" onClick={load}>Reintentar</button></p>}
        {!loading && !loadError && <div className="table-wrapper">
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
                    <span className={`badge-producto-dev badge-producto-${d.productCondition}`}>{conditionLabels[d.productCondition] ?? d.productCondition ?? '—'}</span>
                  </td>
                  <td className="reembolso-dev">{Number(d.refund) > 0 ? `$${Number(d.refund).toLocaleString()}` : '—'}</td>
                  <td>{d.requestedAt?.slice(0, 10) ?? '—'}</td>
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
        </div>}

        {creating && (
          <Modal titulo="Nueva devolución" onClose={() => { if (!saving) setCreating(false); }} footer={<>
            <button className="btn-cancelar-dev" disabled={saving} onClick={() => setCreating(false)}>Cancelar</button>
            <button className="btn-guardar-dev" disabled={saving} onClick={createReturn}>{saving ? 'Guardando...' : 'Registrar solicitud'}</button>
          </>}>
            <p>Selecciona un pedido entregado y el producto que se desea devolver. Registrar una solicitud no realiza un reembolso ni modifica el inventario.</p>
            <label htmlFor="return-order">Pedido entregado</label>
            <select id="return-order" value={newReturn.orderId} onChange={e => setNewReturn({ ...newReturn, orderId: e.target.value, productId: '', quantity: '1' })}>
              <option value="">Selecciona un pedido</option>
              {orders.map(order => <option key={order.id} value={order.id}>PED-{shortReference(order.id)} · {order.customer?.fullName}</option>)}
            </select>
            <label htmlFor="return-product">Producto</label>
            <select id="return-product" disabled={!selectedOrder} value={newReturn.productId} onChange={e => setNewReturn({ ...newReturn, productId: e.target.value, quantity: '1' })}>
              <option value="">Selecciona un producto</option>
              {selectedOrder?.details.map(detail => <option key={detail.productId} value={detail.productId}>{detail.product.name} · {detail.quantity} uds.</option>)}
            </select>
            <label htmlFor="return-quantity">Cantidad</label>
            <input id="return-quantity" type="number" min="1" max={selectedOrder?.details.filter(detail => detail.productId === newReturn.productId).reduce((sum, detail) => sum + detail.quantity, 0) || 100000} step="1" value={newReturn.quantity} onChange={e => setNewReturn({ ...newReturn, quantity: e.target.value })} />
            <label htmlFor="return-reason">Motivo</label>
            <textarea id="return-reason" className="input-dev" maxLength={50} rows={6} value={newReturn.reason} onChange={e => setNewReturn({ ...newReturn, reason: e.target.value })} />
            <small>{newReturn.reason.length}/50 caracteres</small>
          </Modal>
        )}
        {modalOpen && selected && (
          <Modal titulo={`Resolver devolución #${shortReference(selected.id)}`} onClose={() => { if (!resolving) closeModal(); }} footer={<>
            <button className="btn-cancelar-dev" disabled={resolving} onClick={closeModal}>Cancelar</button>
            <button className="btn-guardar-dev" disabled={resolving} onClick={handleResolve}>{resolving ? 'Guardando...' : 'Confirmar resolución'}</button>
          </>}>
            <div className="dev-info-card">
              <p><strong>Cliente:</strong> {selected.customer.fullName}</p>
              <p><strong>Producto:</strong> {selected.product.name}</p>
              <p><strong>Cantidad:</strong> {selected.quantity}</p>
              <p><strong>Motivo:</strong> {selected.reason}</p>
            </div>
            <p>La resolución registra el estado; no ejecuta un reembolso ni modifica el inventario automáticamente.</p>
            <label htmlFor="return-status">Resolución</label>
            <select id="return-status" name="status" value={form.status} onChange={handleChange}>
              <option value="approved">Aprobar</option>
              <option value="rejected">Rechazar</option>
              <option value="refunded">Reembolsada</option>
            </select>
            <label htmlFor="return-condition">Estado del producto</label>
            <select id="return-condition" name="productCondition" value={form.productCondition} onChange={handleChange}>
              <option value="good">Bueno</option>
              <option value="damaged">Dañado</option>
              <option value="modified">Modificado</option>
              <option value="incomplete">Incompleto</option>
            </select>
            <label htmlFor="return-refund">Monto de reembolso registrado</label>
            <input id="return-refund" name="refund" type="number" min="0" step="any" value={form.refund} onChange={handleChange} />
          </Modal>
        )}
      </div>
    </>
  );
}
