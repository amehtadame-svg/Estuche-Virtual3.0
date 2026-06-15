import { useState } from 'react';
import Header from '../../../components/Header/Header';
import './Pedidos.css';

const pedidosIniciales = [
  { id: 1, numero: 'PED-001', cliente: 'Valentina Lopez', fecha: '2025-01-10', total: 85000, estado: 'Entregado' },
  { id: 2, numero: 'PED-002', cliente: 'Isabella Garcia', fecha: '2025-01-12', total: 47000, estado: 'En camino' },
  { id: 3, numero: 'PED-003', cliente: 'Camila Rodriguez', fecha: '2025-01-14', total: 120000, estado: 'Entregado' },
  { id: 4, numero: 'PED-004', cliente: 'Lucia Torres', fecha: '2025-01-16', total: 35000, estado: 'Procesando' },
  { id: 5, numero: 'PED-005', cliente: 'Antonella Ramirez', fecha: '2025-01-18', total: 53000, estado: 'Cancelado' },
];

const estadoColor: Record<string, string> = {
  Entregado: '#27ae60',
  'En camino': '#f39c12',
  Procesando: '#3498db',
  Cancelado: '#e74c3c',
};

const formularioVacio = { numero: '', cliente: '', fecha: '', total: '', estado: 'Procesando' };

export default function Pedidos() {
  const [pedidos, setPedidos] = useState(pedidosIniciales);
  const [formulario, setFormulario] = useState(formularioVacio);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);

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

  const handleGuardar = () => {
    if (!formulario.numero || !formulario.cliente || !formulario.fecha || !formulario.total) {
      mostrarMensaje('Por favor completa todos los campos.');
      return;
    }
    if (editandoId !== null) {
      setPedidos(pedidos.map((p) =>
        p.id === editandoId ? { ...p, ...formulario, total: Number(formulario.total) } : p
      ));
      mostrarMensaje('Pedido actualizado.');
    } else {
      setPedidos([...pedidos, { id: Date.now(), ...formulario, total: Number(formulario.total) }]);
      mostrarMensaje('Pedido agregado.');
    }
    cerrarModal();
  };

  const handleEditar = (p: typeof pedidosIniciales[0]) => {
    setFormulario({ numero: p.numero, cliente: p.cliente, fecha: p.fecha, total: String(p.total), estado: p.estado });
    setEditandoId(p.id);
    setModalAbierto(true);
  };

  const handleEliminar = (id: number) => {
    setPedidos(pedidos.filter((p) => p.id !== id));
    mostrarMensaje('Pedido eliminado.');
  };

  const cambiarEstado = (id: number, nuevoEstado: string) => {
    setPedidos(pedidos.map((p) => p.id === id ? { ...p, estado: nuevoEstado } : p));
    mostrarMensaje('Estado actualizado.');
  };

  return (
    <>
      <Header />
      <div className="pedidos-page">

        <div className="pedidos-topbar">
          <h2 className="titulo-pedidos">Gestion de Pedidos</h2>
          <button className="btn-nuevo-pedido" onClick={abrirModalNuevo}>
            + Nuevo pedido
          </button>
        </div>

        {mensaje && <div className="mensaje-pedidos">{mensaje}</div>}

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
              <tr key={ped.id}>
                <td className="numero-pedido">{ped.numero}</td>
                <td className="cliente-pedido">{ped.cliente}</td>
                <td>{ped.fecha}</td>
                <td className="total-pedido">${ped.total.toLocaleString()}</td>
                <td>
                  <select
                    value={ped.estado}
                    onChange={(e) => cambiarEstado(ped.id, e.target.value)}
                    className="estado-select-pedido"
                    style={{ backgroundColor: estadoColor[ped.estado] || '#999' }}
                  >
                    <option value="Procesando">Procesando</option>
                    <option value="En camino">En camino</option>
                    <option value="Entregado">Entregado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </td>
                <td>
                  <button className="btn-editar-pedido" onClick={() => handleEditar(ped)}>Editar</button>
                  <button className="btn-eliminar-pedido" onClick={() => handleEliminar(ped.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <div
          className="modal-overlay-pedido"
          onClick={(e) => { if (e.target === e.currentTarget) cerrarModal(); }}
        >
          <div className="modal-pedidos">

            <div className="modal-header-pedido">
              <h2 className="modal-titulo-pedido">
                {editandoId !== null ? 'Editar pedido' : 'Nuevo pedido'}
              </h2>
              <button className="modal-cerrar-pedido" onClick={cerrarModal}>✕</button>
            </div>

            <div className="modal-body-pedido">
              <label className="label-pedido">N° Pedido</label>
              <input className="input-pedido" name="numero" value={formulario.numero} onChange={handleCambio} placeholder="PED-006" />

              <label className="label-pedido">Cliente</label>
              <input className="input-pedido" name="cliente" value={formulario.cliente} onChange={handleCambio} placeholder="Nombre del cliente" />

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
            </div>

            <div className="modal-footer-pedido">
              <button className="btn-guardar-pedido" onClick={handleGuardar}>
                {editandoId !== null ? 'Guardar cambios' : 'Agregar pedido'}
              </button>
              <button className="btn-cancelar-pedido" onClick={cerrarModal}>
                Cancelar
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
      