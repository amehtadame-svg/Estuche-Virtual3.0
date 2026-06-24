import { useState, useEffect } from 'react';
import Modal from '../../../components/Modal/Modal';
import './Pedidos.css';

import { API } from '../../../api';

const estadoColor: Record<string, string> = {
  Entregado: '#27ae60',
  'En camino': '#f39c12',
  Procesando: '#3498db',
  Cancelado: '#e74c3c',
};

const formularioVacio = { id_cliente: '', id_empleado: '', fecha: '', total: '', estado: 'Procesando' };

interface Pedido {
  id_pedido: number;
  id_cliente: number | null;
  id_empleado: number | null;
  fecha: string | null;
  total: number | null;
  estado: string | null;
  clientes?: { nombre: string } | null;
}

export default function Pedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [formulario, setFormulario] = useState(formularioVacio);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cargando, setCargando] = useState(true);

  const cargarPedidos = () => {
    fetch(`${API.pedidos}`)
      .then(r => r.json())
      .then(data => { setPedidos(data); setCargando(false); })
      .catch(() => { mostrarMensaje('Error al cargar pedidos.'); setCargando(false); });
  };

  useEffect(() => { cargarPedidos(); }, []);

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
    if (!formulario.id_cliente || !formulario.fecha || !formulario.total) {
      mostrarMensaje('Por favor completa todos los campos.');
      return;
    }

    const body = {
      id_cliente: Number(formulario.id_cliente),
      id_empleado: formulario.id_empleado ? Number(formulario.id_empleado) : null,
      fecha: formulario.fecha,
      total: Number(formulario.total),
      estado: formulario.estado,
    };

    if (editandoId !== null) {
      await fetch(`${API.pedidos}/${editandoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      mostrarMensaje('Pedido actualizado.');
    } else {
      await fetch(`${API.pedidos}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      mostrarMensaje('Pedido agregado.');
    }

    cargarPedidos();
    cerrarModal();
  };

  const handleEditar = (p: Pedido) => {
    setFormulario({
      id_cliente: String(p.id_cliente ?? ''),
      id_empleado: String(p.id_empleado ?? ''),
      fecha: p.fecha ? p.fecha.split('T')[0] : '',
      total: String(p.total ?? ''),
      estado: p.estado ?? 'Procesando',
    });
    setEditandoId(p.id_pedido);
    setModalAbierto(true);
  };

  const handleEliminar = async (id: number) => {
    await fetch(`${API.pedidos}/${id}`, { method: 'DELETE' });
    setPedidos(pedidos.filter(p => p.id_pedido !== id));
    mostrarMensaje('Pedido eliminado.');
  };

  const cambiarEstado = async (id: number, nuevoEstado: string) => {
    await fetch(`${API.pedidos}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado }),
    });
    setPedidos(pedidos.map(p => p.id_pedido === id ? { ...p, estado: nuevoEstado } : p));
    mostrarMensaje('Estado actualizado.');
  };

  return (
    <>
      <div className="pedidos-page">

        <div className="pedidos-topbar">
          <h2 className="titulo-pedidos">Gestion de Pedidos</h2>
          <p className="subtitulo-usuarios">Administra los Pedidos registrados</p>
          <button className="btn-nuevo-pedido" onClick={abrirModalNuevo}>
            + Nuevo pedido
          </button>
        </div>

        {mensaje && <div className="mensaje-pedidos">{mensaje}</div>}

        {cargando ? (
          <p style={{ color: 'var(--text)', padding: '20px 0' }}>Cargando pedidos...</p>
        ) : (
          <table className="tabla-pedidos">
            <thead>
              <tr>
                <th>N° Pedido</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((ped) => (
                <tr key={ped.id_pedido}>
                  <td className="numero-pedido">PED-{String(ped.id_pedido).padStart(3, '0')}</td>
                  <td className="cliente-pedido">{ped.clientes?.nombre ?? `Cliente #${ped.id_cliente}`}</td>
                  <td>{ped.fecha ? ped.fecha.split('T')[0] : '—'}</td>
                  <td className="total-pedido">${Number(ped.total).toLocaleString()}</td>
                  <td>
                    <select
                      value={ped.estado ?? 'Procesando'}
                      onChange={(e) => cambiarEstado(ped.id_pedido, e.target.value)}
                      className="estado-select-pedido"
                      style={{ backgroundColor: estadoColor[ped.estado ?? ''] || '#999' }}
                    >
                      <option value="Procesando">Procesando</option>
                      <option value="En camino">En camino</option>
                      <option value="Entregado">Entregado</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                  </td>
                  <td>
                    <button className="btn-editar-pedido" onClick={() => handleEditar(ped)}>Editar</button>
                    <button className="btn-eliminar-pedido" onClick={() => handleEliminar(ped.id_pedido)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalAbierto && (
        <Modal
          titulo={editandoId !== null ? 'Editar pedido' : 'Nuevo pedido'}
          onClose={cerrarModal}
          footer={
            <>
              <button className="btn-cancelar-pedido" onClick={cerrarModal}>Cancelar</button>
              <button className="btn-guardar-pedido" onClick={handleGuardar}>
                {editandoId !== null ? 'Guardar cambios' : 'Agregar pedido'}
              </button>
            </>
          }
        >
          <label className="label-pedido">ID Cliente</label>
          <input className="input-pedido" name="id_cliente" type="number" value={formulario.id_cliente} onChange={handleCambio} placeholder="ID del cliente" />

          <label className="label-pedido">ID Empleado (opcional)</label>
          <input className="input-pedido" name="id_empleado" type="number" value={formulario.id_empleado} onChange={handleCambio} placeholder="ID del empleado" />

          <label className="label-pedido">Fecha</label>
          <input className="input-pedido" type="date" name="fecha" value={formulario.fecha} onChange={handleCambio} />

          <label className="label-pedido">Total</label>
          <input className="input-pedido" type="number" name="total" value={formulario.total} onChange={handleCambio} placeholder="85000" />

          <label className="label-pedido">Estado</label>
          <select className="input-pedido" name="estado" value={formulario.estado} onChange={handleCambio}>
            <option value="Procesando">Procesando</option>
            <option value="En camino">En camino</option>
            <option value="Entregado">Entregado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </Modal>
      )}
    </>
  );
}