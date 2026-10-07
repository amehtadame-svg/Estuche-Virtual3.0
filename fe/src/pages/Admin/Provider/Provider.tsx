import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import './Provider.css';
import { API, authHeaders } from '../../../api/api';

const emptyForm = { name: '', email: '', phone: '', address: '' };

/** Convierte la respuesta del backend en un mensaje legible. */
const readError = async (res: Response, fallback: string) => {
  try {
    const data = await res.json();
    return data?.message ?? fallback;
  } catch {
    return fallback;
  }
};

interface ProviderCategory {
  category: { name: string };
}

interface Provider {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  providerCategories: ProviderCategory[];
}

export default function Provider() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProviders = async () => {
    try {
      const res = await fetch(API.providers, { headers: authHeaders() });
      if (!res.ok) throw new Error(await readError(res, 'Error al cargar proveedores.'));
      setProviders(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar proveedores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 2500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
    if (!form.name || !form.email || !form.phone) {
      showMessage('Por favor completa todos los campos.');
      return;
    }

    const body = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      address: form.address,
    };

    setError('');
    try {
      const url = editingId !== null ? `${API.providers}/${editingId}` : API.providers;
      const method = editingId !== null ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });

      if (!res.ok) {
        setError(await readError(res, 'No se pudo guardar el proveedor.'));
        return;
      }

      showMessage(editingId !== null ? 'Proveedor actualizado.' : 'Proveedor agregado.');
      await loadProviders();
      closeModal();
    } catch {
      setError('No se pudo conectar con el servidor.');
    }
  };

  const handleEdit = (p: Provider) => {
    setForm({
      name: p.name,
      email: p.email ?? '',
      phone: p.phone ?? '',
      address: p.address ?? '',
    });
    setEditingId(p.id);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    setError('');
    try {
      const res = await fetch(`${API.providers}/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) {
        setError(await readError(res, 'No se pudo eliminar el proveedor.'));
        return;
      }
      showMessage('Proveedor eliminado.');
      await loadProviders();
    } catch {
      setError('No se pudo conectar con el servidor.');
    }
  };

  return (
    <>
      <div className="proveedores-page">
        <div className="proveedores-topbar">
          <div>
            <h2 className="titulo-proveedores">Gestion de Proveedores</h2>
            <p className="subtitulo-usuarios">Administra los Proveedores registrados</p>
          </div>
          <button className="btn-nuevo-proveedor" onClick={openNewModal}>
            + Nuevo proveedor
          </button>
        </div>

        {message && <div className="mensaje-proveedores">{message}</div>}
        {error && <div className="mensaje-proveedores mensaje-proveedores-error">{error}</div>}

        {loading ? (
          <p style={{ color: 'var(--text)', padding: '20px 0' }}>Cargando proveedores...</p>
        ) : (
          <div className="table-wrapper">
            <table className="tabla-proveedores">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Correo</th>
                  <th>Telefono</th>
                  <th>Direccion</th>
                  <th>Categorias que provee</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((p) => (
                  <tr key={p.id}>
                    <td className="empresa-proveedor">{p.name}</td>
                    <td>{p.email ?? '—'}</td>
                    <td>{p.phone ?? '—'}</td>
                    <td>{p.address ?? '—'}</td>
                    <td>
                      {p.providerCategories && p.providerCategories.length > 0
                        ? p.providerCategories.map((pc) => pc.category.name).join(', ')
                        : '—'}
                    </td>
                    <td>
                      <button onClick={() => handleEdit(p)} className="btn-editar-proveedor">Editar</button>
                      <button onClick={() => handleDelete(p.id)} className="btn-eliminar-proveedor">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {modalOpen && (
          <Modal
            titulo={editingId !== null ? 'Editar proveedor' : 'Nuevo proveedor'}
            onClose={closeModal}
            footer={
              <>
                <button onClick={closeModal} className="btn-cancelar-proveedor">Cancelar</button>
                <button onClick={handleSave} className="btn-guardar-proveedor">
                  {editingId !== null ? 'Guardar cambios' : 'Agregar proveedor'}
                </button>
              </>
            }
          >
            <p className="label-proveedor">Empresa</p>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Nombre de la empresa" className="input-proveedor" />

            <p className="label-proveedor">Correo</p>
            <input name="email" value={form.email} onChange={handleChange} placeholder="correo@empresa.com" className="input-proveedor" />

            <p className="label-proveedor">Telefono</p>
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="Numero de telefono" className="input-proveedor" />

            <p className="label-proveedor">Direccion</p>
            <input name="address" value={form.address} onChange={handleChange} placeholder="Direccion de la empresa" className="input-proveedor" />
          </Modal>
        )}
      </div>
    </>
  );
}