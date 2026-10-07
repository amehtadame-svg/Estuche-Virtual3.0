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

/** Convierte la respuesta del backend en un mensaje legible. */
const readError = async (res: Response, fallback: string) => {
  try {
    const data = await res.json();
    return data?.message ?? fallback;
  } catch {
    return fallback;
  }
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
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadDespatches = async () => {
    try {
      const res = await fetch(API.despatches, { headers: authHeaders() });
      if (!res.ok) throw new Error(await readError(res, 'Error al cargar envios.'));
      setDespatches(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar envios.');
    } finally {
      setLoading(false);
    }
  };

  // GET /api/users exige sesión desde el cierre de la auditoría C-01.
  const loadDrivers = async () => {
    try {
      const res = await fetch(API.users, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      setDrivers(data.filter((u: any) => u.role === 'delivery'));
    } catch {
      /* sin domiciliarios el formulario sigue siendo utilizable */
    }
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
        const res = await fetch(`${API.orders}/${id}`, { headers: authHeaders() });
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

    setError('');
    try {
      const url = editingId !== null ? `${API.despatches}/${editingId}` : API.despatches;
      const method = editingId !== null ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });

      if (!res.ok) {
        setError(await readError(res, 'No se pudo guardar el envío.'));
        return;
      }

      showMessage(editingId !== null ? 'Envio actualizado.' : 'Envio agregado.');
      await loadDespatches();
      closeModal();
    } catch {
      setError('No se pudo conectar con el servidor.');
    }
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
    setError('');
    try {
      const res = await fetch(`${API.despatches}/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) {
        setError(await readError(res, 'No se pudo eliminar el envío.'));
        return;
      }
      showMessage('Envio eliminado.');
      await loadDespatches();
    } catch {
      setError('No se pudo conectar con el servidor.');
    }
  };

  // Cambio de estado en la tabla: si la BD lo rechaza se deshace en pantalla.
  const changeStatus = async (id: string, newStatus: string) => {
    const previous = despatches;
    setDespatches(despatches.map((e) => (e.id === id ? { ...e, status: newStatus } : e)));
    setError('');

    try {
      const res = await fetch(`${API.despatches}/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        setDespatches(previous);
        setError(await readError(res, 'Error al actualizar el estado.'));
        return;
      }
      showMessage('Estado actualizado.');
      await loadDespatches();
    } catch {
      setDespatches(previous);
      setError('No se pudo conectar con el servidor.');
    }
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
        {error && <div className="mensaje-envios mensaje-envios-error">{error}</div>}

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