import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import './Provider.css';
import { API, authHeaders } from '../../../api/api';
import { runDeleteAction } from '../../../lib/deleteAction';
import { notify } from '../../../lib/notifications';

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
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProviders = async () => {
    try {
      const response = await fetch(API.providers, {
        headers: authHeaders(),
      });

      if (!response.ok) {
        throw new Error('No se pudieron cargar los proveedores.');
      }

      const data = await response.json();
      setProviders(Array.isArray(data) ? data : []);
    } catch {
      notify.error('Error al cargar proveedores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      notify.error('Por favor completa todos los campos obligatorios.');
      return;
    }

    const body = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      address: form.address,
    };

    const editing = editingId !== null;

    try {
      const response = await fetch(
        editing ? `${API.providers}/${editingId}` : API.providers,
        {
          method: editing ? 'PUT' : 'POST',
          headers: authHeaders(),
          body: JSON.stringify(body),
        },
      );

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        notify.error(
          responseData?.message || 'No se pudo guardar el proveedor.',
        );
        return;
      }

      closeModal();
      await loadProviders();

      notify.success(
        editing
          ? 'Proveedor actualizado exitosamente.'
          : 'Proveedor creado exitosamente.',
        editing ? 'Cambios guardados' : 'Proveedor creado',
      );
    } catch {
      notify.error(
        'No se pudo conectar con el servidor al guardar el proveedor.',
      );
    }
  };

  const handleEdit = (provider: Provider) => {
    setForm({
      name: provider.name,
      email: provider.email ?? '',
      phone: provider.phone ?? '',
      address: provider.address ?? '',
    });
    setEditingId(provider.id);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const deleted = await runDeleteAction({
      url: `${API.providers}/${id}`,
      headers: authHeaders(),
      confirmMessage: '¿Eliminar este proveedor?',
      successMessage: 'Proveedor eliminado exitosamente.',
    });

    if (!deleted) return;

    setProviders((current) =>
      current.filter((provider) => provider.id !== id),
    );
  };

  return (
    <div className="proveedores-page">
      <div className="proveedores-topbar">
        <div>
          <h2 className="titulo-proveedores">Gestión de Proveedores</h2>
          <p className="subtitulo-usuarios">
            Administra los proveedores registrados
          </p>
        </div>

        <button className="btn-nuevo-proveedor" onClick={openNewModal}>
          + Nuevo proveedor
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text)', padding: '20px 0' }}>
          Cargando proveedores...
        </p>
      ) : (
        <div className="table-wrapper">
          <table className="tabla-proveedores">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th>Categorías que provee</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {providers.length === 0 && (<tr><td colSpan={6} className="table-empty">Todavía no hay proveedores registrados.</td></tr>)}
              {providers.map((provider) => (
                <tr key={provider.id}>
                  <td className="empresa-proveedor">{provider.name}</td>
                  <td>{provider.email ?? '—'}</td>
                  <td>{provider.phone ?? '—'}</td>
                  <td>{provider.address ?? '—'}</td>
                  <td>
                    {provider.providerCategories?.length
                      ? provider.providerCategories
                          .map((item) => item.category.name)
                          .join(', ')
                      : '—'}
                  </td>
                  <td>
                    <button
                      onClick={() => handleEdit(provider)}
                      className="btn-editar-proveedor"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(provider.id)}
                      className="btn-eliminar-proveedor"
                    >
                      Eliminar
                    </button>
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
              <button
                onClick={closeModal}
                className="btn-cancelar-proveedor"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="btn-guardar-proveedor"
              >
                {editingId !== null ? 'Guardar cambios' : 'Agregar proveedor'}
              </button>
            </>
          }
        >
          <p className="label-proveedor">Empresa</p>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Nombre de la empresa"
            className="input-proveedor"
          />

          <p className="label-proveedor">Correo</p>
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="correo@empresa.com"
            className="input-proveedor"
          />

          <p className="label-proveedor">Teléfono</p>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Número de teléfono"
            className="input-proveedor"
          />

          <p className="label-proveedor">Dirección</p>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Dirección de la empresa"
            className="input-proveedor"
          />
        </Modal>
      )}
    </div>
  );
}