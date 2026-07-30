import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import { API } from '../../../api/api';
import './Envios.css';

const estadoColor: Record<string, string> = {
  'en camino': '#f39c12',
  'entregado': '#27ae60',
  'devuelto': '#e74c3c',
};

const formularioVacio = {
  id_pedido: '',
  id_repartidor: '',
  direccion: '',
  estado: 'en camino',
};

interface Repartidor {
  id_usuario: number;
  nombre: string;
}

interface Envio {
  id_envio: number;
  id_pedido: number;
  id_repartidor: number | null;
  direccion: string | null;
  fecha_envio: string | null;
  fecha_entregado: string | null;
  estado: string;
  pedidos: {
    id_pedido: number;
  } | null;
  empleados: { nombre: string } | null;
}

export default function Envios() {
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [formulario, setFormulario] = useState(formularioVacio);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cargando, setCargando] = useState(true);

  const cargarEnvios = () => {
    fetch(API.envios)
      .then(r => r.json())
      .then(data => { setEnvios(data); setCargando(false); })
      .catch(() => { mostrarMensaje('Error al cargar envios.'); setCargando(false); });
  };

  const cargarRepartidores = () => {
    fetch(API.usuarios)
      .then(r => r.json())
      .then(data => setRepartidores(data.filter((u: any) => u.rol === 'repartidor')))
      .catch(() => { });
  };

  useEffect(() => {
    cargarEnvios();
    cargarRepartidores();
  }, []);

  const mostrarMensaje = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(''), 2500);
  };

  const handleCambio = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const handleCambioPedido = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.target.value;
    setFormulario({ ...formulario, id_pedido: id, direccion: '' });

    if (id) {
      try {
        const res = await fetch(`${API.pedidos}/${id}`);
        if (res.ok) {
          const pedido = await res.json();
          setFormulario(prev => ({
            ...prev,
            id_pedido: id,
            direccion: pedido.direcciones_entrega?.direccion ?? '',
          }));
        }
      } catch { }
    }
  };

  const abrirModalNuevo = () => {
    setFormulario(formularioVacio);
    setEditandoId(null);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEditandoId(null);
    setFormulario(formularioVacio);
  };

  const handleGuardar = async () => {
    if (!formulario.id_pedido || !formulario.direccion) {
      mostrarMensaje('Por favor completa todos los campos.');
      return;
    }

    const body = {
      id_pedido: Number(formulario.id_pedido),
      id_repartidor: formulario.id_repartidor ? Number(formulario.id_repartidor) : null,
      direccion: formulario.direccion,
      estado: formulario.estado,
    };

    if (editandoId !== null) {
      await fetch(`${API.envios}/${editandoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      mostrarMensaje('Envio actualizado.');
    } else {
      await fetch(API.envios, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      mostrarMensaje('Envio agregado.');
    }

    cargarEnvios();
    cerrarModal();
  };

  const handleEditar = (env: Envio) => {
    setFormulario({
      id_pedido: String(env.id_pedido ?? ''),
      id_repartidor: String(env.id_repartidor ?? ''),
      direccion: env.direccion ?? '',
      estado: env.estado ?? 'en camino',
    });
    setEditandoId(env.id_envio);
    setModalAbierto(true);
  };

  const handleEliminar = async (id: number) => {
    await fetch(`${API.envios}/${id}`, { method: 'DELETE' });
    setEnvios(envios.filter(e => e.id_envio !== id));
    mostrarMensaje('Envio eliminado.');
  };

  const cambiarEstado = async (id: number, nuevoEstado: string) => {
    await fetch(`${API.envios}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado }),
    });
    setEnvios(envios.map(e => e.id_envio === id ? { ...e, estado: nuevoEstado } : e));
    mostrarMensaje('Estado actualizado.');
  };

  return (
    <>
      <div className="envios-page">

        <div className="envios-topbar">
          <div>
            <h2 className="titulo-envios">Gestion de Envios</h2>
            <p className="subtitulo-usuarios">Administra los Envios registrados</p>
          </div>
          <button className="btn-nuevo-envio" onClick={abrirModalNuevo}>
            + Nuevo envio
          </button>
        </div>

        {mensaje && <div className="mensaje-envios">{mensaje}</div>}

        {cargando ? (
          <p style={{ color: 'var(--text)', padding: '20px 0' }}>Cargando envios...</p>
        ) : (
          <div className="table-wrapper">
            <table className="tabla-envios">
              <thead>
                <tr>
                  <th>N° Envio</th>
                  <th>Pedido</th>
                  <th>Repartidor</th>
                  <th>Dirección</th>
                  <th>Fecha envio</th>
                  <th>Fecha entrega</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {envios.map((env) => (
                  <tr key={env.id_envio}>
                    <td className="numero-envio">ENV-{String(env.id_envio).padStart(3, '0')}</td>
                    <td>PED-{String(env.id_pedido).padStart(3, '0')}</td>
                    <td>{env.empleados?.nombre ?? '—'}</td>
                    <td>{env.direccion ?? '—'}</td>
                    <td>{env.fecha_envio ? env.fecha_envio.split('T')[0] : '—'}</td>
                    <td>{env.fecha_entregado ? env.fecha_entregado.split('T')[0] : '—'}</td>
                    <td>
                      <select
                        value={env.estado}
                        onChange={(e) => cambiarEstado(env.id_envio, e.target.value)}
                        className="estado-select"
                        style={{ backgroundColor: estadoColor[env.estado] ?? '#999', color: '#fff' }}
                      >
                        <option value="en camino" style={{ backgroundColor: '#fff', color: '#1E2761' }}>En camino</option>
                        <option value="entregado" style={{ backgroundColor: '#fff', color: '#1E2761' }}>Entregado</option>
                        <option value="devuelto" style={{ backgroundColor: '#fff', color: '#1E2761' }}>Devuelto</option>
                      </select>
                    </td>
                    <td>
                      <button className="btn-editar-envio" onClick={() => handleEditar(env)}>Editar</button>
                      <button className="btn-eliminar-envio" onClick={() => handleEliminar(env.id_envio)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {modalAbierto && (
          <Modal
            titulo={editandoId !== null ? 'Editar envio' : 'Nuevo envio'}
            onClose={cerrarModal}
            footer={
              <>
                <button className="btn-cancelar-envio" onClick={cerrarModal}>Cancelar</button>
                <button className="btn-guardar-envio" onClick={handleGuardar}>
                  {editandoId !== null ? 'Guardar cambios' : 'Agregar envio'}
                </button>
              </>
            }
          >
            <p className="label-envio">N° Pedido (ID)</p>
            <input
              className="input-envio"
              type="number"
              name="id_pedido"
              value={formulario.id_pedido}
              onChange={handleCambioPedido}
              placeholder="ID del pedido"
              disabled={editandoId !== null}
            />

            <p className="label-envio">Dirección</p>
            <input
              className="input-envio"
              name="direccion"
              value={formulario.direccion}
              onChange={handleCambio}
              placeholder="Se carga automáticamente o escribe manualmente"
            />

            <p className="label-envio">Repartidor</p>
            <select
              className="input-envio"
              name="id_repartidor"
              value={formulario.id_repartidor}
              onChange={handleCambio}
            >
              <option value="">Sin asignar</option>
              {repartidores.map(r => (
                <option key={r.id_usuario} value={r.id_usuario}>
                  {r.nombre}
                </option>
              ))}
            </select>

            <p className="label-envio">Estado</p>
            <select
              className="input-envio"
              name="estado"
              value={formulario.estado}
              onChange={handleCambio}
            >
              <option value="en camino">En camino</option>
              <option value="entregado">Entregado</option>
              <option value="devuelto">Devuelto</option>
            </select>
          </Modal>
        )}
      </div>
    </>
  );
}