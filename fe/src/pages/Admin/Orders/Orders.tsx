import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import { API, authHeaders } from '../../../api/api';
import './Orders.css';

const statusColor: Record<string, string> = {
  pending: '#3498db',
  in_transit: '#f39c12',
  delivered: '#27ae60',
  canceled: '#e74c3c',
};

const emptyForm = {
  customerId: '',
  total: '',
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

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState<string | null>(null);

  const loadOrders = () => {
    fetch(API.orders)
      .then((r) => r.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch(() => {
        showMessage('Error al cargar pedidos.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 2500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openNewModal = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDiscountCode('');
    setDiscountApplied(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setDiscountCode('');
    setDiscountApplied(null);
  };

  const handleSave = async () => {
    if (!form.customerId || !form.total) {
      showMessage('Por favor completa todos los campos.');
      return;
    }

    const body = {
      customerId: form.customerId,
      total: Number(form.total),
      status: form.status,
      promotionalCodeId: form.promotionalCodeId || null,
    };

    if (editingId !== null) {
      await fetch(`${API.orders}/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      showMessage('Pedido actualizado.');
    } else {
      await fetch(API.orders, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
      });
      showMessage('Pedido agregado.');
    }

    loadOrders();
    closeModal();
  };

  const handleEdit = (p: Order) => {
    setForm({
      customerId: String(p.customerId ?? ''),
      total: String(p.total ?? ''),
      status: p.status ?? 'pending',
      promotionalCodeId: '',
    });
    setEditingId(p.id);
    setDiscountCode('');
    setDiscountApplied(null);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await fetch(`${API.orders}/${id}`, { method: 'DELETE' });
    setOrders(orders.filter((p) => p.id !== id));
    showMessage('Pedido eliminado.');
  };

  const changeStatus = async (id: string, newStatus: string) => {
    const res = await fetch(`${API.orders}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setOrders(orders.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
      showMessage('Estado actualizado.');
    } else {
      showMessage('Error al actualizar el estado.');
    }
  };

  const handleApplyDiscount = async (id: string) => {
    if (!discountCode) {
      showMessage('Ingresa un código de descuento.');
      return;
    }

    const res = await fetch(`${API.orders}/${id}/apply-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ code: discountCode }),
    });
    const data = await res.json();
    if (res.ok) {
      setForm((prev) => ({ ...prev, total: String(data.total) }));
      setDiscountApplied(`Descuento aplicado. Nuevo total: $${Number(data.total).toLocaleString()}`);
      setDiscountCode('');
      loadOrders();
    } else {
      showMessage(data.message ?? 'Error al aplicar el descuento.');
    }
  };

  return (
    <>
      <div className="pedidos-page">
        <div className="pedidos-topbar">
          <h2 className="titulo-pedidos">Gestion de Pedidos</h2>
          <p className="subtitulo-usuarios">Administra los Pedidos registrados</p>
          <button className="btn-nuevo-pedido" onClick={openNewModal}>
            + Nuevo pedido
          </button>
        </div>

        {message && <div className="mensaje-pedidos">{message}</div>}

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
                      <option value="pending" style={{ backgroundColor: '#fff', color: '#1E2761' }}>Pendiente</option>
                      <option value="in_transit" style={{ backgroundColor: '#fff', color: '#1E2761' }}>En camino</option>
                      <option value="delivered" style={{ backgroundColor: '#fff', color: '#1E2761' }}>Entregado</option>
                      <option value="canceled" style={{ backgroundColor: '#fff', color: '#1E2761' }}>Cancelado</option>
                    </select>
                  </td>
                  <td>
                    <button className="btn-editar-pedido" onClick={() => handleEdit(ped)}>Editar</button>
                    <button className="btn-eliminar-pedido" onClick={() => handleDelete(ped.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <Modal
          titulo={editingId !== null ? 'Editar pedido' : 'Nuevo pedido'}
          onClose={closeModal}
          footer={
            <>
              <button className="btn-cancelar-pedido" onClick={closeModal}>Cancelar</button>
              <button className="btn-guardar-pedido" onClick={handleSave}>
                {editingId !== null ? 'Guardar cambios' : 'Agregar pedido'}
              </button>
            </>
          }
        >
          <label className="label-pedido">ID Cliente</label>
          <input
            className="input-pedido"
            name="customerId"
            value={form.customerId}
            onChange={handleChange}
            placeholder="UUID del cliente"
          />

          <label className="label-pedido">Total</label>
          <input
            className="input-pedido"
            type="number"
            name="total"
            value={form.total}
            onChange={handleChange}
            placeholder="85000"
          />

          <label className="label-pedido">Estado</label>
          <select className="input-pedido" name="status" value={form.status} onChange={handleChange}>
            <option value="pending">Pendiente</option>
            <option value="in_transit">En camino</option>
            <option value="delivered">Entregado</option>
            <option value="canceled">Cancelado</option>
          </select>

          {editingId !== null && (
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
                  onClick={() => handleApplyDiscount(editingId)}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Aplicar
                </button>
              </div>
              {discountApplied && (
                <p style={{ color: '#27ae60', fontWeight: 600, fontSize: 13, marginTop: 8 }}>{discountApplied}</p>
              )}
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
