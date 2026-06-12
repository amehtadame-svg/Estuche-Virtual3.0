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

  const mostrarMensaje = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(''), 2500);
  };

  const handleCambio = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
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
      setEditandoId(null);
    } else {
      setPedidos([...pedidos, { id: Date.now(), ...formulario, total: Number(formulario.total) }]);
      mostrarMensaje('Pedido agregado.');
    }

    setFormulario(formularioVacio);
  };

  const handleEditar = (p: typeof pedidosIniciales[0]) => {
    setFormulario({ numero: p.numero, cliente: p.cliente, fecha: p.fecha, total: String(p.total), estado: p.estado });
    setEditandoId(p.id);
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
    <div>
      <h2 className="titulo-pedidos">Gestion de Pedidos</h2>

      {mensaje && <div className="mensaje-pedidos">{mensaje}</div>}

      <div className="contenedor-pedidos">

        <div className="formulario-pedidos">
          <h2 className="subtitulo-pedidos">
            {editandoId !== null ? 'Editar pedido' : 'Agregar pedido'}
          </h2>

          <p className="label-pedido">N° Pedido</p>
          <input className="input-pedido" name="numero" value={formulario.numero} onChange={handleCambio} placeholder="PED-006" />

          <p className="label-pedido">Cliente</p>
          <input className="input-pedido" name="cliente" value={formulario.cliente} onChange={handleCambio} placeholder="Nombre del cliente" />

          <p className="label-pedido">Fecha</p>
          <input className="input-pedido" type="date" name="fecha" value={formulario.fecha} onChange={handleCambio} />

          <p className="label-pedido">Total</p>
          <input className="input-pedido" type="number" name="total" value={formulario.total} onChange={handleCambio} placeholder="85000" />

          <p className="label-pedido">Estado</p>
          <select className="input-pedido" name="estado" value={formulario.estado} onChange={handleCambio}>
            <option value="Procesando">Procesando</option>
            <option value="En camino">En camino</option>
            <option value="Entregado">Entregado</option>
            <option value="Cancelado">Cancelado</option>
          </select>

          <button className="btn-guardar-pedido" onClick={handleGuardar}>
            {editandoId !== null ? 'Guardar cambios' : 'Agregar pedido'}
          </button>

          {editandoId !== null && (
            <button className="btn-cancelar-pedido" onClick={() => { setEditandoId(null); setFormulario(formularioVacio); }}>
              Cancelar
            </button>
          )}
        </div>

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
    </div>
    </>
  );
}
      