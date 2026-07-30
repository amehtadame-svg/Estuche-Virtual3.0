// UsuariosSA.tsx
import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import { API } from '../../../api/api';
import './UsuariosSA.css';

interface Usuario {
  id_usuario: number;
  nombre:     string;
  email:      string;
  telefono:   string | null;
  rol:        string;
}

const roles = ['superadmin', 'administrador', 'empleado', 'repartidor', 'cliente'];

const rolColor: Record<string, string> = {
  superadmin:    '#7c3aed',
  administrador: '#2563eb',
  empleado:      '#0891b2',
  repartidor:    '#d97706',
  cliente:       '#6b7280',
};

const formularioVacio = { nombre: '', email: '', password: '', telefono: '', rol: 'cliente' };

export default function UsuariosSA() {
  const [usuarios, setUsuarios]       = useState<Usuario[]>([]);
  const [filtroRol, setFiltroRol]     = useState('todos');
  const [busqueda, setBusqueda]       = useState('');
  const [mensaje, setMensaje]         = useState('');
  const [modalNuevo, setModalNuevo]   = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalEliminar, setModalEliminar] = useState<Usuario | null>(null);
  const [formulario, setFormulario]   = useState(formularioVacio);
  const [editandoId, setEditandoId]   = useState<number | null>(null);

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const mostrarMensaje = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(''), 2500);
  };

  const cargar = async () => {
    const res = await fetch(API.usuarios, { headers });
    if (res.ok) setUsuarios(await res.json());
  };

  useEffect(() => { cargar(); }, []);

  const handleCambio = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const handleCrear = async () => {
    if (!formulario.nombre || !formulario.email || !formulario.password) {
      mostrarMensaje('Nombre, email y contraseña son obligatorios.');
      return;
    }
    const res = await fetch(API.usuarios, {
      method: 'POST',
      headers,
      body: JSON.stringify(formulario),
    });
    if (res.ok) {
      mostrarMensaje('Usuario creado.');
      setModalNuevo(false);
      setFormulario(formularioVacio);
      cargar();
    }
  };

  const abrirEditar = (u: Usuario) => {
    setFormulario({ nombre: u.nombre, email: u.email, password: '', telefono: u.telefono ?? '', rol: u.rol });
    setEditandoId(u.id_usuario);
    setModalEditar(true);
  };

  const handleEditar = async () => {
    if (!editandoId) return;
    const res = await fetch(`${API.usuarios}/${editandoId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ nombre: formulario.nombre, email: formulario.email, rol: formulario.rol }),
    });
    if (res.ok) {
      mostrarMensaje('Usuario actualizado.');
      setModalEditar(false);
      setEditandoId(null);
      setFormulario(formularioVacio);
      cargar();
    }
  };

  const handleEliminar = async () => {
    if (!modalEliminar) return;
    const res = await fetch(`${API.usuarios}/${modalEliminar.id_usuario}`, { method: 'DELETE', headers });
    if (res.ok) {
      mostrarMensaje('Usuario eliminado.');
      setModalEliminar(null);
      cargar();
    }
  };

  const handleRol = async (id: number, rol: string) => {
    const res = await fetch(`${API.usuarios}/${id}/rol`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ rol }),
    });
    if (res.ok) { mostrarMensaje('Rol actualizado.'); cargar(); }
  };

  const usuariosFiltrados = usuarios
    .filter((u) => filtroRol === 'todos' || u.rol === filtroRol)
    .filter((u) =>
      u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email.toLowerCase().includes(busqueda.toLowerCase())
    );

  return (
    <>
      <div className="usuariossa-page">

        <div className="usuariossa-topbar">
          <h2 className="titulo-usuariossa">Gestión de Usuarios</h2>
          <button className="btn-nuevo-usuariossa" onClick={() => setModalNuevo(true)}>
            + Nuevo usuario
          </button>
        </div>

        {mensaje && <div className="mensaje-usuariossa">{mensaje}</div>}

        {/* Filtros */}
        <div className="usuariossa-controles">
          <input
            className="busqueda-usuariossa"
            placeholder="Buscar por nombre o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <div className="filtros-rol">
            {['todos', ...roles].map((r) => (
              <button
                key={r}
                className={`btn-filtro-rol ${filtroRol === r ? 'btn-filtro-rol-activo' : ''}`}
                onClick={() => setFiltroRol(r)}
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
              {usuariosFiltrados.map((u) => (
                <tr key={u.id_usuario}>
                  <td className="id-usuariossa">#{u.id_usuario}</td>
                  <td className="nombre-usuariossa">{u.nombre}</td>
                  <td className="email-usuariossa">{u.email}</td>
                  <td>
                    <span
                      className="badge-rol"
                      style={{ backgroundColor: rolColor[u.rol] ?? '#6b7280' }}
                    >
                      {u.rol}
                    </span>
                  </td>
                  <td>
                    <select
                      className="select-rol-usuariossa"
                      value={u.rol}
                      onChange={(e) => handleRol(u.id_usuario, e.target.value)}
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="acciones-usuariossa">
                    <button className="btn-editar-usuariossa" onClick={() => abrirEditar(u)}>Editar</button>
                    <button className="btn-eliminar-usuariossa" onClick={() => setModalEliminar(u)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Nuevo */}
        {modalNuevo && (
          <Modal
            titulo="Nuevo usuario"
            onClose={() => { setModalNuevo(false); setFormulario(formularioVacio); }}
            footer={
              <>
                <button className="btn-cancelar-sa" onClick={() => { setModalNuevo(false); setFormulario(formularioVacio); }}>Cancelar</button>
                <button className="btn-guardar-sa" onClick={handleCrear}>Crear usuario</button>
              </>
            }
          >
            <label>Nombre</label>
            <input name="nombre" value={formulario.nombre} onChange={handleCambio} placeholder="Nombre completo" />

            <label>Email</label>
            <input name="email" type="email" value={formulario.email} onChange={handleCambio} placeholder="correo@ejemplo.com" />

            <label>Contraseña</label>
            <input name="password" type="password" value={formulario.password} onChange={handleCambio} placeholder="Mínimo 6 caracteres" />

            <label>Teléfono</label>
            <input name="telefono" value={formulario.telefono} onChange={handleCambio} placeholder="Opcional" />

            <label>Rol</label>
            <select name="rol" value={formulario.rol} onChange={handleCambio}>
              {roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Modal>
        )}

        {/* Modal Editar */}
        {modalEditar && (
          <Modal
            titulo="Editar usuario"
            onClose={() => { setModalEditar(false); setFormulario(formularioVacio); }}
            footer={
              <>
                <button className="btn-cancelar-sa" onClick={() => { setModalEditar(false); setFormulario(formularioVacio); }}>Cancelar</button>
                <button className="btn-guardar-sa" onClick={handleEditar}>Guardar cambios</button>
              </>
            }
          >
            <label>Nombre</label>
            <input name="nombre" value={formulario.nombre} onChange={handleCambio} />

            <label>Email</label>
            <input name="email" type="email" value={formulario.email} onChange={handleCambio} />

            <label>Rol</label>
            <select name="rol" value={formulario.rol} onChange={handleCambio}>
              {roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Modal>
        )}

        {/* Modal Eliminar */}
        {modalEliminar && (
          <Modal
            titulo="Eliminar usuario"
            onClose={() => setModalEliminar(null)}
            footer={
              <>
                <button className="btn-cancelar-sa" onClick={() => setModalEliminar(null)}>Cancelar</button>
                <button className="btn-eliminar-confirm-sa" onClick={handleEliminar}>Sí, eliminar</button>
              </>
            }
          >
            <div className="eliminar-warning">
              <p>¿Estás seguro de que deseas eliminar a <strong>{modalEliminar.nombre}</strong>?</p>
              <p className="eliminar-warning-sub">Esta acción eliminará también sus pedidos, envíos y facturas asociadas.</p>
            </div>
          </Modal>
        )}

      </div>
    </>
  );
}