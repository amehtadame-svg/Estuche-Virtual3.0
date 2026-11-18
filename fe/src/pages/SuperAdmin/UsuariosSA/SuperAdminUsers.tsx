import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import { API, authHeaders } from '../../../api/api';
import { runDeleteAction } from '../../../lib/deleteAction';
import { runApiAction } from '../../../lib/apiAction';
import { notify } from '../../../lib/notifications';
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
  const [modalNew, setModalNew] = useState(false);
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [modalEdit, setModalEdit] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const headers = authHeaders();

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
    if (modalNew) setCreateError('');
  };

  const handleCreate = async () => {
    setCreateError('');

    const fullName = form.fullName.trim();
    const email = form.email.trim();
    const password = form.password;

    if (!fullName || !email || !password) {
      const errorMessage = 'Nombre, correo y contraseña son obligatorios.';
      setCreateError(errorMessage);
      notify.error(errorMessage);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const errorMessage = 'Escribe un correo electrónico válido.';
      setCreateError(errorMessage);
      notify.error(errorMessage);
      return;
    }

    if (password.length < 6) {
      const errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
      setCreateError(errorMessage);
      notify.error(errorMessage);
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(API.users, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          fullName,
          email,
          password,
          phone: form.phone.trim() || undefined,
          role: form.role,
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || 'No se pudo crear el usuario.');
      }

      setModalNew(false);
      setForm(emptyForm);
      await load();
      notify.success('El usuario se creó correctamente.', 'Usuario creado');
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'No se pudo crear el usuario.';
      setCreateError(errorMessage);
      notify.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (u: User) => {
    setForm({ fullName: u.fullName, email: u.email, password: '', phone: u.phone ?? '', role: u.role });
    setEditingId(u.id);
    setModalEdit(true);
  };

  const handleEdit = async () => {
    if (!editingId) return;
    const response = await runApiAction({
      url: `${API.users}/${editingId}`,
      init: { method: 'PUT', headers, body: JSON.stringify({ fullName: form.fullName, email: form.email, role: form.role }) },
      successMessage: 'Usuario actualizado exitosamente.',
      errorMessage: 'No se pudo actualizar el usuario.',
    });
    if (!response) return;
    setModalEdit(false);
    setEditingId(null);
    setForm(emptyForm);
    await load();
  };

  const handleDelete = async (user: User) => {
    const deleted = await runDeleteAction({
      url: `${API.users}/${user.id}`,
      headers,
      confirmMessage: `¿Eliminar a ${user.fullName}? Esta acción también eliminará sus pedidos, envíos y recibos asociados.`,
      successMessage: 'Usuario eliminado exitosamente.',
    });
    if (!deleted) return;
    await load();
  };

  const handleRole = async (id: string, role: string) => {
    const response = await runApiAction({
      url: `${API.users}/${id}/role`,
      init: { method: 'PATCH', headers, body: JSON.stringify({ role }) },
      successMessage: 'Rol actualizado exitosamente.',
      errorMessage: 'No se pudo actualizar el rol.',
    });
    if (!response) return;
    await load();
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
        <button
          className="btn-nuevo-usuariossa"
          onClick={() => {
            setForm(emptyForm);
            setCreateError('');
            setModalNew(true);
          }}
        >
          + Nuevo usuario
        </button>
      </div>

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
                  <button className="btn-eliminar-usuariossa" onClick={() => handleDelete(u)}>
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
            setCreateError('');
          }}
          footer={
            <>
              <button
                className="btn-cancelar-sa"
                onClick={() => {
                  setModalNew(false);
                  setForm(emptyForm);
                  setCreateError('');
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-guardar-sa"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? 'Creando usuario...' : 'Crear usuario'}
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
          {createError && <p className="error-crear-usuariossa">⚠️ {createError}</p>}
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

    </div>
  );
}
