import { useState, useEffect } from 'react';
import Modal from '../../../components/Modal/Modal';
import { API } from '../../../api';
import './Envios.css';

const estadoColor: Record<string, string> = {
  Entregado: '#27ae60',
  'En camino': '#f39c12',
  Preparando: '#3498db',
  Cancelado: '#e74c3c',
};

const formularioVacio = { id_pedido: '', id_repartidor: '', direccion: '', fecha: '', estado: 'Preparando' };

interface Envio {
  id_envio: number;
  id_pedido: number | null;
  id_repartidor: number | null;
  direccion: string | null;
  fecha: string | null;
  estado: string | null;
  pedidos: { id_pedido: number; clientes: { nombre: string } | null } | null;
  empleados: { nombre: string } | null;
}

export default function Envios() {
  const [envios, setEnvios] = useState<Envio[]>([]);
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

  useEffect(() => { cargarEnvios(); }, []);

  const mostrarMensaje = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(''), 2500);
  };

  const handleCambio = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
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
    if (!formulario.id_pedido || !formulario.direccion || !formulario.fecha) {
      mostrarMensaje('Por favor completa todos los campos.');
      return;
    }

    const body = {
      id_pedido: Number(formulario.id_pedido),
      id_repartidor: formulario.id_repartidor ? Number(formulario.id_repartidor) : null,
      direccion: formulario.direccion,
      fecha: formulario.fecha,
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
      fecha: env.fecha ? env.fecha.split('T')[0] : '',
      estado: env.estado ?? 'Preparando',
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
                  <th>Cliente</th>
                  <th>Dirección</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {envios.map((env) => (
                  <tr key={env.id_envio}>
                    <td className="numero-envio">ENV-{String(env.id_envio).padStart(3, '0')}</td>
                    <td>PED-{String(env.id_pedido).padStart(3, '0')}</td>
                    <td className="cliente-envio">{env.pedidos?.clientes?.nombre ?? `Cliente #${env.pedidos?.id_pedido}`}</td>
                    <td>{env.direccion ?? '—'}</td>
                    <td>{env.fecha ? env.fecha.split('T')[0] : '—'}</td>
                    <td>
                      <select
                        value={env.estado ?? 'Preparando'}
                        onChange={(e) => cambiarEstado(env.id_envio, e.target.value)}
                        className="estado-select"
                        style={{ backgroundColor: estadoColor[env.estado ?? ''] || '#999' }}
                      >
                        <option value="Preparando">Preparando</option>
                        <option value="En camino">En camino</option>
                        <option value="Entregado">Entregado</option>
                        <option value="Cancelado">Cancelado</option>
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
            <input className="input-envio" type="number" name="id_pedido" value={formulario.id_pedido} onChange={handleCambio} placeholder="ID del pedido" />

            <p className="label-envio">ID Repartidor (opcional)</p>
            <input className="input-envio" type="number" name="id_repartidor" value={formulario.id_repartidor} onChange={handleCambio} placeholder="ID del repartidor" />

            <p className="label-envio">Dirección</p>
            <input className="input-envio" name="direccion" value={formulario.direccion} onChange={handleCambio} placeholder="Calle 10 # 5-20, Bogota" />

            <p className="label-envio">Fecha</p>
            <input className="input-envio" type="date" name="fecha" value={formulario.fecha} onChange={handleCambio} />

            <p className="label-envio">Estado</p>
            <select className="input-envio" name="estado" value={formulario.estado} onChange={handleCambio}>
              <option value="Preparando">Preparando</option>
              <option value="En camino">En camino</option>
              <option value="Entregado">Entregado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </Modal>
        )}
      </div>
    </>
  );
}