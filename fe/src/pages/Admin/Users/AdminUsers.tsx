import { useEffect, useRef, useState } from 'react';
import { shortReference } from '../../../lib/reference';
import './AdminUsers.css';
import { API, authHeaders } from '../../../api/api';
import { notify } from '../../../lib/notifications';
import { roleLabel } from '../../../lib/statusLabels';
import Modal from '../../../components/ui/Modal';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
}

const EMPTY: Omit<User, 'id' | 'isActive'> & { password: string } = {
  fullName: '',
  email: '',
  role: 'client',
  password: '',
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [modal, setModal] = useState<'crear' | 'editar' | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch(API.users, { headers: authHeaders() });
      if (!response.ok) throw new Error();
      const data: unknown = await response.json();
      if (!Array.isArray(data)) throw new Error();
      setUsers(data.filter((u: User) => u.role === 'client' || u.role === 'employee'));
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
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
    if (savingRef.current) return;
    setModal(null);
    setEditId(null);
    setError('');
  };

  const handleSave = async () => {
    if (savingRef.current) return;
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

    savingRef.current = true;
    setSaving(true);
    try {
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.message || 'No se pudo guardar el usuario.');
        return;
      }
      const editing = modal === 'editar';
      const name = form.fullName;
      savingRef.current = false;
      closeModal();
      load();
      notify.success(editing ? `La información de ${name} se actualizó correctamente.` : `El usuario ${name} se creó correctamente.`, editing ? 'Cambios guardados' : 'Usuario creado');
    } catch {
      setError('No se pudo confirmar el guardado. Verifica el estado antes de intentarlo de nuevo.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const query = search.trim().toLocaleLowerCase();
  const filteredUsers = users.filter(u => (roleFilter === 'all' || u.role === roleFilter) &&
    [u.fullName, u.email].some(value => value.toLocaleLowerCase().includes(query)));

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

        <div className="staff-controls">
          <input type="search" className="staff-search" aria-label="Buscar usuarios" placeholder="Buscar por nombre o email..." maxLength={150} value={search} onChange={e => setSearch(e.target.value)} />
          <div className="staff-filters" aria-label="Filtrar usuarios por rol">
            {[{ value: 'all', label: 'Todos' }, { value: 'employee', label: 'Empleado' }, { value: 'client', label: 'Cliente' }].map(option => (
              <button type="button" key={option.value} className={`staff-filter ${roleFilter === option.value ? 'is-active' : ''}`} aria-pressed={roleFilter === option.value} onClick={() => setRoleFilter(option.value)}>{option.label}</button>
            ))}
          </div>
        </div>
        {loading ? (
          <p className="usuarios-loading" role="status">Cargando usuarios...</p>
        ) : loadError ? (
          <p role="alert">No se pudo cargar la lista de usuarios. <button type="button" onClick={load}>Reintentar</button></p>
        ) : (
          <div className="usuarios-table-wrap">
            <table className="usuarios-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 && (<tr><td colSpan={6} className="table-empty">No se encontraron usuarios.</td></tr>)}
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>#{shortReference(u.id)}</td>
                    <td>{u.fullName}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`rol-badge ${u.role}`}>{roleLabel[u.role] ?? u.role}</span>
                    </td>
                    <td>
                      <span className={`usr-estado ${u.isActive ? 'activo' : 'inactivo'}`}>
                        {u.isActive ? '● Activa' : '○ Inactiva'}
                      </span>
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
        <Modal titulo={modal === 'crear' ? 'Nuevo usuario' : 'Editar usuario'} onClose={closeModal} footer={<>
          <button className="usr-btn-cancelar" disabled={saving} onClick={closeModal}>Cancelar</button>
          <button className="usr-btn-guardar" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
        </>}>
              <label htmlFor="admin-user-name">Nombre</label>
              <input
                id="admin-user-name"
                maxLength={150}
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Nombre completo"
              />

              <label htmlFor="admin-user-email">Email</label>
              <input
                id="admin-user-email" type="email"
                maxLength={255}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="correo@ejemplo.com"
              />

              {modal === 'crear' && (
                <>
                  <label htmlFor="admin-user-password">Contraseña</label>
                  <input
                    id="admin-user-password" type="password"
                    maxLength={72}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                  />
                </>
              )}

              <label htmlFor="admin-user-role">Rol</label>
              <select id="admin-user-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="client">Cliente</option>
                <option value="employee">Empleado</option>
              </select>

              {error && <p className="usr-error" role="alert">{error}</p>}
        </Modal>
      )}
    </>
  );
}