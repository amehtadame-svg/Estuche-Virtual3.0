import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import { API, authHeaders } from '../../../api/api';
import './Despatch.css';

const statusColor: Record<string, string> = {
  in_transit: '#f39c12',
  delivered: '#27ae60',
  returned: '#e74c3c',
  canceled: '#999',
};

const emptyForm = {
  orderId: '',
  driverId: '',
  address: '',
  status: 'in_transit',
};

interface Driver {
  id: string;
  fullName: string;
}

interface Despatch {
  id: string;
  orderId: string;
  driverId: string | null;
  address: string | null;
  shipDate: string | null;
  deliveredAt: string | null;
  status: string;
  order: { id: string } | null;
  driver: { fullName: string } | null;
}

export default function Despatch() {
  const [despatches, setDespatches] = useState<Despatch[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadDespatches = () => {
    fetch(API.despatches, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        setDespatches(data);
        setLoading(false);
      })
      .catch(() => {
        showMessage('Error al cargar envios.');
        setLoading(false);
      });
  };

  const loadDrivers = () => {
    fetch(API.users)
      .then((r) => r.json())
      .then((data) => setDrivers(data.filter((u: any) => u.role === 'delivery')))
      .catch(() => {});
  };

  useEffect(() => {
    loadDespatches();
    loadDrivers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 2500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleOrderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.target.value;
    setForm({ ...form, orderId: id, address: '' });

    if (id) {
      try {
        const res = await fetch(`${API.orders}/${id}`);
        if (res.ok) {
          const order = await res.json();
          setForm((prev) => ({
            ...prev,
            orderId: id,
            address: order.deliveryAddress?.address ?? '',
          }));
        }
      } catch {
        /* noop */
      }
    }
  };

  const openNewModal = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!form.orderId || !form.address) {
      showMessage('Por favor completa todos los campos.');
      return;
    }

    const body = {
      orderId: form.orderId,
      driverId: form.driverId || null,
      address: form.address,
      status: form.status,
    };

    if (editingId !== null) {
      await fetch(`${API.despatches}/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
      });
      showMessage('Envio actualizado.');
    } else {
      await fetch(API.despatches, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
      });
      showMessage('Envio agregado.');
    }

    loadDespatches();
    closeModal();
  };

  const handleEdit = (env: Despatch) => {
    setForm({
      orderId: String(env.orderId ?? ''),
      driverId: String(env.driverId ?? ''),
      address: env.address ?? '',
      status: env.status ?? 'in_transit',
    });
    setEditingId(env.id);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await fetch(`${API.despatches}/${id}`, { method: 'DELETE', headers: authHeaders() });
    setDespatches(despatches.filter((e) => e.id !== id));
    showMessage('Envio eliminado.');
  };

  const changeStatus = async (id: string, newStatus: string) => {
    await fetch(`${API.despatches}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ status: newStatus }),
    });
    setDespatches(despatches.map((e) => (e.id === id ? { ...e, status: newStatus } : e)));
    showMessage('Estado actualizado.');
  };

  return (
    <>
      <div className="envios-page">
        <div className="envios-topbar">
          <div>
            <h2 className="titulo-envios">Gestion de Envios</h2>
            <p className="subtitulo-usuarios">Administra los Envios registrados</p>
          </div>
          <button className="btn-nuevo-envio" onClick={openNewModal}>
            + Nuevo envio
          </button>
        </div>

        {message && <div className="mensaje-envios">{message}</div>}

        {loading ? (
          <p style={{ color: 'var(--text)', padding: '20px 0' }}>Cargando envios...</p>
        ) : (
          <div className="table-wrapper">
            <table className="tabla-envios">
              <thead>
                <tr>
                  <th>N° Envio</th>
                  <th>Pedido</th>
                  <th>Repartidor</th>
                  <th>Dirección</th>
                  <th>Fecha envio</th>
                  <th>Fecha entrega</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {despatches.map((env) => (
                  <tr key={env.id}>
                    <td className="numero-envio">ENV-{env.id.slice(0, 6).toUpperCase()}</td>
                    <td>{env.order ? `PED-${env.order.id.slice(0, 6).toUpperCase()}` : '—'}</td>
                    <td>{env.driver?.fullName ?? '—'}</td>
                    <td>{env.address ?? '—'}</td>
                    <td>{env.shipDate ? env.shipDate.split('T')[0] : '—'}</td>
                    <td>{env.deliveredAt ? env.deliveredAt.split('T')[0] : '—'}</td>
                    <td>
                      <select
                        value={env.status}
                        onChange={(e) => changeStatus(env.id, e.target.value)}
                        className="estado-select"
                        style={{ backgroundColor: statusColor[env.status] ?? '#999', color: '#fff' }}
                      >
                        <option value="in_transit" style={{ backgroundColor: '#fff', color: '#1E2761' }}>En camino</option>
                        <option value="delivered" style={{ backgroundColor: '#fff', color: '#1E2761' }}>Entregado</option>
                        <option value="returned" style={{ backgroundColor: '#fff', color: '#1E2761' }}>Devuelto</option>
                      </select>
                    </td>
                    <td>
                      <button className="btn-editar-envio" onClick={() => handleEdit(env)}>Editar</button>
                      <button className="btn-eliminar-envio" onClick={() => handleDelete(env.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {modalOpen && (
          <Modal
            titulo={editingId !== null ? 'Editar envio' : 'Nuevo envio'}
            onClose={closeModal}
            footer={
              <>
                <button className="btn-cancelar-envio" onClick={closeModal}>Cancelar</button>
                <button className="btn-guardar-envio" onClick={handleSave}>
                  {editingId !== null ? 'Guardar cambios' : 'Agregar envio'}
                </button>
              </>
            }
          >
            <p className="label-envio">N° Pedido (ID)</p>
            <input
              className="input-envio"
              name="orderId"
              value={form.orderId}
              onChange={handleOrderChange}
              placeholder="UUID del pedido"
              disabled={editingId !== null}
            />

            <p className="label-envio">Dirección</p>
            <input
              className="input-envio"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Se carga automáticamente o escribe manualmente"
            />

            <p className="label-envio">Repartidor</p>
            <select className="input-envio" name="driverId" value={form.driverId} onChange={handleChange}>
              <option value="">Sin asignar</option>
              {drivers.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.fullName}
                </option>
              ))}
            </select>

            <p className="label-envio">Estado</p>
            <select className="input-envio" name="status" value={form.status} onChange={handleChange}>
              <option value="in_transit">En camino</option>
              <option value="delivered">Entregado</option>
              <option value="returned">Devuelto</option>
            </select>
          </Modal>
        )}
      </div>
    </>
  );
}
