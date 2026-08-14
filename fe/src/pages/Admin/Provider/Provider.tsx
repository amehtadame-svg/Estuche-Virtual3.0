import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import './Provider.css';
import { API } from '../../../api/api';

const emptyForm = { name: '', email: '', phone: '', address: '' };

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
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProviders = () => {
    fetch(API.providers)
      .then((r) => r.json())
      .then((data) => {
        setProviders(data);
        setLoading(false);
      })
      .catch(() => {
        showMessage('Error al cargar proveedores.');
        setLoading(false);
      });
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

    if (editingId !== null) {
      await fetch(`${API.providers}/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      showMessage('Proveedor actualizado.');
    } else {
      await fetch(API.providers, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      showMessage('Proveedor agregado.');
    }

    loadProviders();
    closeModal();
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
    await fetch(`${API.providers}/${id}`, { method: 'DELETE' });
    setProviders(providers.filter((p) => p.id !== id));
    showMessage('Proveedor eliminado.');
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
