import { useEffect, useState } from 'react';
import './Usuarios.css';

import { API } from '../../../api';

interface Usuario {
  id_usuario: number;
  nombre: string;
  email: string;
  rol: string;
}

const EMPTY: Omit<Usuario, 'id_usuario'> & { password: string } = {
  nombre: '', email: '', rol: 'cliente', password: ''
};

export default function Usuarios() {
  const [usuarios, setUsuarios]     = useState<Usuario[]>([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState<'crear' | 'editar' | null>(null);
  const [form, setForm]             = useState({ ...EMPTY });
  const [editId, setEditId]         = useState<number | null>(null);
  const [confirmDel, setConfirmDel] = useState<number | null>(null);
  const [previewDel, setPreviewDel] = useState<any | null>(null);
  const [error, setError]           = useState('');

  const cargar = () => {
    setLoading(true);
    fetch(API.usuarios)
      .then(r => r.json())
      .then(data => { setUsuarios(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const abrirCrear = () => {
    setForm({ ...EMPTY });
    setError('');
    setModal('crear');
  };

  const abrirEditar = (u: Usuario) => {
    setForm({ nombre: u.nombre, email: u.email, rol: u.rol, password: '' });
    setEditId(u.id_usuario);
    setError('');
    setModal('editar');
  };

  const cerrarModal = () => { setModal(null); setEditId(null); setError(''); };

  const handleGuardar = async () => {
    setError('');
    if (!form.nombre || !form.email) { setError('Nombre y email son obligatorios.'); return; }
    if (modal === 'crear' && !form.password) { setError('La contraseña es obligatoria.'); return; }

    const url    = modal === 'crear' ? API.usuarios : `${API.usuarios}/${editId}`;
    const method = modal === 'crear' ? 'POST' : 'PUT';
    const body   = modal === 'crear'
      ? { nombre: form.nombre, email: form.email, password: form.password, rol: form.rol }
      : { nombre: form.nombre, email: form.email, rol: form.rol };

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

    cerrarModal();
    cargar();
  };

  const pedirConfirmacionEliminar = async (id: number) => {
    setConfirmDel(id);
    setPreviewDel(null);
    try {
      const res = await fetch(`${API.usuarios}/${id}/preview-delete`);
      const data = await res.json();
      setPreviewDel(data);
    } catch {
      setPreviewDel(null);
    }
  };

  const handleEliminar = async (id: number) => {
    await fetch(`${API.usuarios}/${id}`, { method: 'DELETE' });
    setConfirmDel(null);
    setPreviewDel(null);
    cargar();
  };

  return (
    <>
      <div className="usuarios-page">

        <div className="usuarios-topbar">
          <div>
            <h2 className="titulo-usuarios">Gestión de usuarios</h2>
            <p className="subtitulo-usuarios">Administra los usuarios registrados</p>
          </div>
          <button className="usr-btn-nuevo" onClick={abrirCrear}>+ Nuevo usuario</button>
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
                {usuarios.map(u => (
                  <tr key={u.id_usuario}>
                    <td>{u.id_usuario}</td>
                    <td>{u.nombre}</td>
                    <td>{u.email}</td>
                    <td><span className={`rol-badge ${u.rol}`}>{u.rol}</span></td>
                    <td>
                      <div className="usr-acciones">
                        <button className="usr-btn-editar" onClick={() => abrirEditar(u)}>Editar</button>
                        <button className="usr-btn-eliminar" onClick={() => pedirConfirmacionEliminar(u.id_usuario)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal crear/editar */}
      {modal && (
        <div className="usr-overlay" onClick={cerrarModal}>
          <div className="usr-modal" onClick={e => e.stopPropagation()}>

            <div className="usr-modal-header">
              <h2 className="usr-modal-titulo">
                {modal === 'crear' ? 'Nuevo usuario' : 'Editar usuario'}
              </h2>
              <button className="usr-modal-cerrar" onClick={cerrarModal}>✕</button>
            </div>

            <div className="usr-modal-body">
              <label>Nombre</label>
              <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre completo" />

              <label>Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="correo@ejemplo.com" />

              {modal === 'crear' && (
                <>
                  <label>Contraseña</label>
                  <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" />
                </>
              )}

              <label>Rol</label>
              <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}>
                <option value="cliente">cliente</option>
                <option value="administrador">administrador</option>
              </select>

              {error && <p className="usr-error">⚠️ {error}</p>}
            </div>

            <div className="usr-modal-footer">
              <button className="usr-btn-cancelar" onClick={cerrarModal}>Cancelar</button>
              <button className="usr-btn-guardar" onClick={handleGuardar}>Guardar</button>
            </div>

          </div>
        </div>
      )}

      {/* Confirmar eliminar */}
      {confirmDel && (
        <div className="usr-overlay" onClick={() => { setConfirmDel(null); setPreviewDel(null); }}>
          <div className="usr-modal usr-confirm" onClick={e => e.stopPropagation()}>

            <div className="usr-modal-header">
              <h2 className="usr-modal-titulo">¿Eliminar usuario?</h2>
              <button className="usr-modal-cerrar" onClick={() => { setConfirmDel(null); setPreviewDel(null); }}>✕</button>
            </div>

            <div className="usr-modal-body">
              <p className="usr-confirm">Esta acción no se puede deshacer.</p>
              {previewDel ? (
                (previewDel.pedidos_como_cliente > 0 || previewDel.pedidos_como_empleado > 0 || previewDel.envios_como_repartidor > 0) ? (
                  <ul style={{ fontSize: 13, color: 'var(--text)', marginTop: 8, paddingLeft: 18 }}>
                    {previewDel.pedidos_como_cliente > 0 && (
                      <li>{previewDel.pedidos_como_cliente} pedido(s) como cliente — se eliminarán</li>
                    )}
                    {previewDel.detalle_pedido > 0 && (
                      <li>{previewDel.detalle_pedido} detalle(s) de esos pedidos — se eliminarán</li>
                    )}
                    {previewDel.envios_de_esos_pedidos > 0 && (
                      <li>{previewDel.envios_de_esos_pedidos} envío(s) de esos pedidos — se eliminarán</li>
                    )}
                    {previewDel.pedidos_como_empleado > 0 && (
                      <li>{previewDel.pedidos_como_empleado} pedido(s) donde figura como empleado — quedarán sin empleado asignado</li>
                    )}
                    {previewDel.envios_como_repartidor > 0 && (
                      <li>{previewDel.envios_como_repartidor} envío(s) donde figura como repartidor — quedarán sin repartidor asignado</li>
                    )}
                  </ul>
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--text)', marginTop: 8 }}>Este usuario no tiene datos relacionados.</p>
                )
              ) : (
                <p style={{ fontSize: 13, color: 'var(--text)', marginTop: 8 }}>Revisando datos relacionados...</p>
              )}
            </div>

            <div className="usr-modal-footer">
              <button className="usr-btn-cancelar" onClick={() => { setConfirmDel(null); setPreviewDel(null); }}>Cancelar</button>
              <button className="usr-btn-eliminar-confirm" onClick={() => handleEliminar(confirmDel)}>Eliminar</button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}