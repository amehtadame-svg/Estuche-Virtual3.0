import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import { API, authHeaders } from '../../../api/api';
import { orderStatusLabel } from '../../../lib/statusLabels';
import './Orders.css';

const statusColor: Record<string, string> = {
  pending: '#3498db',
  paid: '#2980b9',
  preparing: '#8e44ad',
  shipped: '#f39c12',
  delivered: '#27ae60',
  canceled: '#e74c3c',
  returned: '#c0392b',
};

// Los valores son los del enum OrderStatus de la base de datos. Antes el
// desplegable ofrecía "in_transit", que no existe en el enum: el backend
// rechazaba el cambio y el estado del pedido nunca se guardaba.
const STATUS_OPTIONS = Object.keys(orderStatusLabel);

const emptyForm = {
  status: 'pending',
  promotionalCodeId: '',
};

interface Order {
  id: string;
  customerId: string | null;
  total: number | null;
  status: string | null;
  orderDate: string | null;
  customer: { fullName: string } | null;
  promotionalCode: { code: string; value: number } | null;
  driver: { fullName: string } | null;
}

const readError = async (res: Response, fallback: string) => {
  try {
    const data = await res.json();
    return data?.message ?? fallback;
  } catch {
    return fallback;
  }
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      const res = await fetch(API.orders, { headers: authHeaders() });
      if (!res.ok) throw new Error(await readError(res, 'Error al cargar pedidos.'));
      setOrders(await res.json());
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar pedidos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const showMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 2500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setDiscountCode('');
    setDiscountApplied(null);
  };

  // El total lo calcula el servidor a partir de los productos reales (C-02),
  // aquí solo se envía el estado y los datos logísticos.
  const handleSave = async () => {
    if (!editingId) {
      showMessage('Para crear un pedido usa el checkout de la tienda.');
      return;
    }

    setError('');
    const body = {
      status: form.status,
      ...(form.promotionalCodeId ? { promotionalCodeId: form.promotionalCodeId } : {}),
    };

    try {
      const res = await fetch(`${API.orders}/${editingId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError(await readError(res, 'No se pudo actualizar el pedido.'));
        return;
      }
      showMessage('Pedido actualizado.');
      await loadOrders();
      closeModal();
    } catch {
      setError('No se pudo conectar con el servidor.');
    }
  };

  const handleEdit = (p: Order) => {
    setForm({
      status: p.status ?? 'pending',
      promotionalCodeId: '',
    });
    setEditingId(p.id);
    setDiscountCode('');
    setDiscountApplied(null);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    setError('');
    try {
      const res = await fetch(`${API.orders}/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) {
        setError(await readError(res, 'No se pudo eliminar el pedido.'));
        return;
      }
      showMessage('Pedido eliminado.');
      await loadOrders();
    } catch {
      setError('No se pudo conectar con el servidor.');
    }
  };

  // Cambio de estado en la tabla: se guarda en el momento y se recarga la
  // lista desde la BD, así lo que ves siempre es lo que quedó grabado.
  const changeStatus = async (id: string, newStatus: string) => {
    const previous = orders;
    setOrders(orders.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
    setError('');

    try {
      const res = await fetch(`${API.orders}/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        setOrders(previous); // se deshace el cambio si la BD lo rechaza
        setError(await readError(res, 'Error al actualizar el estado.'));
        return;
      }
      showMessage('Estado actualizado.');
      await loadOrders();
    } catch {
      setOrders(previous);
      setError('No se pudo conectar con el servidor.');
    }
  };

  const handleApplyDiscount = async (id: string) => {
    if (!discountCode) {
      showMessage('Ingresa un código de descuento.');
      return;
    }

    setError('');
    try {
      const res = await fetch(`${API.orders}/${id}/apply-code`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ code: discountCode }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(await readError(res, 'Error al aplicar el descuento.'));
        return;
      }
      setDiscountApplied(`Descuento aplicado. Nuevo total: $${Number(data.total).toLocaleString()}`);
      setDiscountCode('');
      await loadOrders();
    } catch {
      setError('No se pudo conectar con el servidor.');
    }
  };

  return (
    <>
      <div className="pedidos-page">
        <div className="pedidos-topbar">
          <h2 className="titulo-pedidos">Gestion de Pedidos</h2>
          <p className="subtitulo-usuarios">Administra los Pedidos registrados</p>
        </div>

        {message && <div className="mensaje-pedidos">{message}</div>}
        {error && <div className="mensaje-pedidos mensaje-pedidos-error">{error}</div>}

        {loading ? (
          <p style={{ color: 'var(--text)', padding: '20px 0' }}>Cargando pedidos...</p>
        ) : (
          <table className="tabla-pedidos">
            <thead>
              <tr>
                <th>N° Pedido</th>
                <th>Cliente</th>
                <th>Descuento</th>
                <th>Total pedido</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((ped) => (
                <tr key={ped.id}>
                  <td className="numero-pedido">PED-{ped.id.slice(0, 6).toUpperCase()}</td>
                  <td className="cliente-pedido">{ped.customer?.fullName ?? `Cliente #${ped.customerId?.slice(0, 6) ?? '-'}`}</td>
                  <td>{ped.promotionalCode ? `${ped.promotionalCode.code} (${ped.promotionalCode.value})` : '—'}</td>
                  <td className="total-pedido">${Number(ped.total).toLocaleString()}</td>
                  <td>{ped.orderDate ? ped.orderDate.split('T')[0] : '—'}</td>
                  <td>
                    <select
                      value={ped.status ?? 'pending'}
                      onChange={(e) => changeStatus(ped.id, e.target.value)}
                      className="estado-select-pedido"
                      style={{ backgroundColor: statusColor[ped.status ?? ''] || '#999', color: '#fff' }}
                    >
                      {STATUS_OPTIONS.map((value) => (
                        <option key={value} value={value} style={{ backgroundColor: '#fff', color: '#1E2761' }}>
                          {orderStatusLabel[value]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button className="btn-editar-pedido" onClick={() => handleEdit(ped)}>Detalle</button>
                    <button className="btn-eliminar-pedido" onClick={() => handleDelete(ped.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {orders.length === 0 && !loading && <p className="pedidos-vacio">No hay pedidos registrados.</p>}
      </div>

      {modalOpen && (
        <Modal
          titulo="Detalle del pedido"
          onClose={closeModal}
          footer={
            <>
              <button className="btn-cancelar-pedido" onClick={closeModal}>Cancelar</button>
              <button className="btn-guardar-pedido" onClick={handleSave}>
                Guardar cambios
              </button>
            </>
          }
        >
          <label className="label-pedido">Estado</label>
          <select className="input-pedido" name="status" value={form.status} onChange={handleChange}>
            {STATUS_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {orderStatusLabel[value]}
              </option>
            ))}
          </select>

          <div style={{ marginTop: 16 }}>
            <label className="label-pedido">Código de descuento</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input-pedido"
                placeholder="Ej: REGRESO10"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                style={{ marginBottom: 0 }}
              />
              <button
                className="btn-guardar-pedido"
                onClick={() => editingId && handleApplyDiscount(editingId)}
                style={{ whiteSpace: 'nowrap' }}
              >
                Aplicar
              </button>
            </div>
            {discountApplied && (
              <p style={{ color: '#27ae60', fontWeight: 600, fontSize: 13, marginTop: 8 }}>{discountApplied}</p>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
