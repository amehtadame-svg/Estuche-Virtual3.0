import { useEffect, useState } from 'react';
import './AdminUsers.css';
import { API } from '../../../api/api';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

const EMPTY: Omit<User, 'id'> & { password: string } = {
  fullName: '',
  email: '',
  role: 'client',
  password: '',
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'crear' | 'editar' | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    fetch(API.users)
      .then((r) => r.json())
      .then((data) => {
        const filtered = data.filter((u: User) => u.role === 'client' || u.role === 'employee');
        setUsers(filtered);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setForm({ ...EMPTY });
    setError('');
    setModal('crear');
  };

  const openEdit = (u: User) => {
    setForm({ fullName: u.fullName, email: u.email, role: u.role, password: '' });
    setEditId(u.id);
    setError('');
    setModal('editar');
  };

  const closeModal = () => {
    setModal(null);
    setEditId(null);
    setError('');
  };

  const handleSave = async () => {
    setError('');
    if (!form.fullName || !form.email) {
      setError('Nombre y email son obligatorios.');
      return;
    }
    if (modal === 'crear' && !form.password) {
      setError('La contraseña es obligatoria.');
      return;
    }

    const url = modal === 'crear' ? API.users : `${API.users}/${editId}`;
    const method = modal === 'crear' ? 'POST' : 'PUT';
    const body =
      modal === 'crear'
        ? { fullName: form.fullName, email: form.email, password: form.password, role: form.role }
        : { fullName: form.fullName, email: form.email, role: form.role };

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.message || 'Error al guardar.');
      return;
    }

    closeModal();
    load();
  };

  return (
    <>
      <div className="usuarios-page">
        <div className="usuarios-topbar">
          <div>
            <h2 className="titulo-usuarios">Gestión de usuarios</h2>
            <p className="subtitulo-usuarios">Clientes y empleados registrados</p>
          </div>
          <button className="usr-btn-nuevo" onClick={openCreate}>
            + Nuevo usuario
          </button>
        </div>

        {loading ? (
          <p className="usuarios-loading">Cargando usuarios...</p>
        ) : (
          <div className="usuarios-table-wrap">
            <table className="usuarios-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id.slice(0, 8)}</td>
                    <td>{u.fullName}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`rol-badge ${u.role}`}>{u.role}</span>
                    </td>
                    <td>
                      <div className="usr-acciones">
                        <button className="usr-btn-editar" onClick={() => openEdit(u)}>
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="usr-overlay" onClick={closeModal}>
          <div className="usr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="usr-modal-header">
              <h2 className="usr-modal-titulo">{modal === 'crear' ? 'Nuevo usuario' : 'Editar usuario'}</h2>
              <button className="usr-modal-cerrar" onClick={closeModal}>
                ✕
              </button>
            </div>

            <div className="usr-modal-body">
              <label>Nombre</label>
              <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Nombre completo" />

              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="correo@ejemplo.com" />

              {modal === 'crear' && (
                <>
                  <label>Contraseña</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" />
                </>
              )}

              <label>Rol</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="client">client</option>
                <option value="employee">employee</option>
              </select>

              {error && <p className="usr-error">⚠️ {error}</p>}
            </div>

            <div className="usr-modal-footer">
              <button className="usr-btn-cancelar" onClick={closeModal}>
                Cancelar
              </button>
              <button className="usr-btn-guardar" onClick={handleSave}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
