import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import { API, authHeaders } from '../../../api/api';
import './SuperAdminUsers.css';

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
}

const roles = ['superadmin', 'admin', 'employee', 'delivery', 'client'];

const roleColor: Record<string, string> = {
  superadmin: '#7c3aed',
  admin: '#2563eb',
  employee: '#0891b2',
  delivery: '#d97706',
  client: '#6b7280',
};

const emptyForm = { fullName: '', email: '', password: '', phone: '', role: 'client' };

export default function SuperAdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState('todos');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [modalNew, setModalNew] = useState(false);
  const [modalEdit, setModalEdit] = useState(false);
  const [modalDelete, setModalDelete] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const headers = authHeaders();

  const showMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 2500);
  };

  const load = async () => {
    const res = await fetch(API.users, { headers });
    if (res.ok) setUsers(await res.json());
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async () => {
    if (!form.fullName || !form.email || !form.password) {
      showMessage('Nombre, email y contraseña son obligatorios.');
      return;
    }
    const res = await fetch(API.users, {
      method: 'POST',
      headers,
      body: JSON.stringify({ fullName: form.fullName, email: form.email, password: form.password, role: form.role }),
    });
    if (res.ok) {
      showMessage('Usuario creado.');
      setModalNew(false);
      setForm(emptyForm);
      load();
    }
  };

  const openEdit = (u: User) => {
    setForm({ fullName: u.fullName, email: u.email, password: '', phone: u.phone ?? '', role: u.role });
    setEditingId(u.id);
    setModalEdit(true);
  };

  const handleEdit = async () => {
    if (!editingId) return;
    const res = await fetch(`${API.users}/${editingId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ fullName: form.fullName, email: form.email, role: form.role }),
    });
    if (res.ok) {
      showMessage('Usuario actualizado.');
      setModalEdit(false);
      setEditingId(null);
      setForm(emptyForm);
      load();
    }
  };

  const handleDelete = async () => {
    if (!modalDelete) return;
    const res = await fetch(`${API.users}/${modalDelete.id}`, { method: 'DELETE', headers });
    if (res.ok) {
      showMessage('Usuario eliminado.');
      setModalDelete(null);
      load();
    }
  };

  const handleRole = async (id: string, role: string) => {
    const res = await fetch(`${API.users}/${id}/role`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      showMessage('Rol actualizado.');
      load();
    }
  };

  const filteredUsers = users
    .filter((u) => roleFilter === 'todos' || u.role === roleFilter)
    .filter(
      (u) =>
        u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="usuariossa-page">
      <div className="usuariossa-topbar">
        <h2 className="titulo-usuariossa">Gestión de Usuarios</h2>
        <button className="btn-nuevo-usuariossa" onClick={() => setModalNew(true)}>
          + Nuevo usuario
        </button>
      </div>

      {message && <div className="mensaje-usuariossa">{message}</div>}

      {/* Filtros */}
      <div className="usuariossa-controles">
        <input
          className="busqueda-usuariossa"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="filtros-rol">
          {['todos', ...roles].map((r) => (
            <button
              key={r}
              className={`btn-filtro-rol ${roleFilter === r ? 'btn-filtro-rol-activo' : ''}`}
              onClick={() => setRoleFilter(r)}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrapper">
        <table className="tabla-usuariossa">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Cambiar rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id}>
                <td className="id-usuariossa">#{u.id.slice(0, 6).toUpperCase()}</td>
                <td className="nombre-usuariossa">{u.fullName}</td>
                <td className="email-usuariossa">{u.email}</td>
                <td>
                  <span className="badge-rol" style={{ backgroundColor: roleColor[u.role] ?? '#6b7280' }}>
                    {u.role}
                  </span>
                </td>
                <td>
                  <select className="select-rol-usuariossa" value={u.role} onChange={(e) => handleRole(u.id, e.target.value)}>
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="acciones-usuariossa">
                  <button className="btn-editar-usuariossa" onClick={() => openEdit(u)}>
                    Editar
                  </button>
                  <button className="btn-eliminar-usuariossa" onClick={() => setModalDelete(u)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Nuevo */}
      {modalNew && (
        <Modal
          titulo="Nuevo usuario"
          onClose={() => {
            setModalNew(false);
            setForm(emptyForm);
          }}
          footer={
            <>
              <button
                className="btn-cancelar-sa"
                onClick={() => {
                  setModalNew(false);
                  setForm(emptyForm);
                }}
              >
                Cancelar
              </button>
              <button className="btn-guardar-sa" onClick={handleCreate}>
                Crear usuario
              </button>
            </>
          }
        >
          <label>Nombre</label>
          <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Nombre completo" />

          <label>Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="correo@ejemplo.com" />

          <label>Contraseña</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Mínimo 6 caracteres" />

          <label>Teléfono</label>
          <input name="phone" value={form.phone} onChange={handleChange} placeholder="Opcional" />

          <label>Rol</label>
          <select name="role" value={form.role} onChange={handleChange}>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Modal>
      )}

      {/* Modal Editar */}
      {modalEdit && (
        <Modal
          titulo="Editar usuario"
          onClose={() => {
            setModalEdit(false);
            setForm(emptyForm);
          }}
          footer={
            <>
              <button
                className="btn-cancelar-sa"
                onClick={() => {
                  setModalEdit(false);
                  setForm(emptyForm);
                }}
              >
                Cancelar
              </button>
              <button className="btn-guardar-sa" onClick={handleEdit}>
                Guardar cambios
              </button>
            </>
          }
        >
          <label>Nombre</label>
          <input name="fullName" value={form.fullName} onChange={handleChange} />

          <label>Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} />

          <label>Rol</label>
          <select name="role" value={form.role} onChange={handleChange}>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Modal>
      )}

      {/* Modal Eliminar */}
      {modalDelete && (
        <Modal
          titulo="Eliminar usuario"
          onClose={() => setModalDelete(null)}
          footer={
            <>
              <button className="btn-cancelar-sa" onClick={() => setModalDelete(null)}>
                Cancelar
              </button>
              <button className="btn-eliminar-confirm-sa" onClick={handleDelete}>
                Sí, eliminar
              </button>
            </>
          }
        >
          <div className="eliminar-warning">
            <p>
              ¿Estás seguro de que deseas eliminar a <strong>{modalDelete.fullName}</strong>?
            </p>
            <p className="eliminar-warning-sub">Esta acción eliminará también sus pedidos, envíos y recibos asociados.</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
