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
  isActive: boolean;
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
    const res = await fetch(API.users, {
      method: 'POST',
      headers,
      body: JSON.stringify(form),
    });
    if (res.ok) {
      showMessage('Usuario creado.');
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

  // HU-018 · "Desactivar" ya no borra: solo inactiva la cuenta y conserva el historial.
  const handleToggleActive = async (id: string, isActive: boolean) => {
    const res = await fetch(`${API.users}/${id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ isActive }),
    });

    if (res.ok) {
      showMessage(isActive ? 'Cuenta reactivada.' : 'Cuenta desactivada. Su historial se conserva.');
      setModalDelete(null);
      load();
      return;
    }

    const data = await res.json().catch(() => null);
    showMessage(data?.message || 'No se pudo actualizar la cuenta.');
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
              <th>Estado</th>
              <th>Cambiar rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id} className={u.isActive ? undefined : 'fila-inactiva'}>
                <td className="id-usuariossa">#{u.id.slice(0, 6).toUpperCase()}</td>
                <td className="nombre-usuariossa">{u.fullName}</td>
                <td className="email-usuariossa">{u.email}</td>
                <td>
                  <span className="badge-rol" style={{ backgroundColor: roleColor[u.role] ?? '#6b7280' }}>
                    {u.role}
                  </span>
                </td>
                <td>
                  <span className={`badge-estado ${u.isActive ? 'badge-estado-activo' : 'badge-estado-inactivo'}`}>
                    {u.isActive ? '● Activa' : '○ Inactiva'}
                  </span>
                </td>
                <td>
                  <select
                    className="select-rol-usuariossa"
                    value={u.role}
                    onChange={(e) => handleRole(u.id, e.target.value)}
                  >
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
                  {u.isActive ? (
                    <button className="btn-eliminar-usuariossa" onClick={() => setModalDelete(u)}>
                      Desactivar
                    </button>
                  ) : (
                    <button className="btn-editar-usuariossa" onClick={() => handleToggleActive(u.id, true)}>
                      Reactivar
                    </button>
                  )}
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

      {/* Modal Desactivar */}
      {modalDelete && (
        <Modal
          titulo="Desactivar cuenta"
          onClose={() => setModalDelete(null)}
          footer={
            <>
              <button className="btn-cancelar-sa" onClick={() => setModalDelete(null)}>
                Cancelar
              </button>
              <button
                className="btn-eliminar-confirm-sa"
                onClick={() => handleToggleActive(modalDelete.id, false)}
              >
                Sí, desactivar
              </button>
            </>
          }
        >
          <div className="eliminar-warning">
            <p>
              ¿Desactivar la cuenta de <strong>{modalDelete.fullName}</strong>?
            </p>
            <p className="eliminar-warning-sub">
              El usuario no podrá iniciar sesión, pero <strong>no se borra nada</strong>: sus pedidos, recibos,
              envíos y movimientos se conservan intactos. Puedes reactivarla cuando quieras.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}