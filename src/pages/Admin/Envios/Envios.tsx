import { useState } from 'react';
import Header from '../../../components/Header/Header';
import './Envios.css';

const enviosIniciales = [
  { id: 1, numero: 'ENV-001', pedido: 'PED-001', cliente: 'Valentina Lopez', direccion: 'Calle 10 # 5-20, Bogota', fecha: '2025-01-11', estado: 'Entregado' },
  { id: 2, numero: 'ENV-002', pedido: 'PED-002', cliente: 'Isabella Garcia', direccion: 'Carrera 7 # 45-30, Medellin', fecha: '2025-01-13', estado: 'En camino' },
  { id: 3, numero: 'ENV-003', pedido: 'PED-003', cliente: 'Camila Rodriguez', direccion: 'Av 6N # 23-15, Cali', fecha: '2025-01-15', estado: 'Entregado' },
  { id: 4, numero: 'ENV-004', pedido: 'PED-004', cliente: 'Lucia Torres', direccion: 'Calle 5 # 12-40, Barranquilla', fecha: '2025-01-17', estado: 'Preparando' },
];

const estadoColor: Record<string, string> = {
  Entregado: '#27ae60',
  'En camino': '#f39c12',
  Preparando: '#3498db',
  Cancelado: '#e74c3c',
};

const formularioVacio = { numero: '', pedido: '', cliente: '', direccion: '', fecha: '', estado: 'Preparando' };

export default function Envios() {
  const [envios, setEnvios] = useState(enviosIniciales);
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
    if (!formulario.numero || !formulario.pedido || !formulario.cliente || !formulario.direccion || !formulario.fecha) {
      mostrarMensaje('Por favor completa todos los campos.');
      return;
    }

    if (editandoId !== null) {
      setEnvios(envios.map((e) => e.id === editandoId ? { ...e, ...formulario } : e));
      mostrarMensaje('Envio actualizado.');
      setEditandoId(null);
    } else {
      setEnvios([...envios, { id: Date.now(), ...formulario }]);
      mostrarMensaje('Envio agregado.');
    }

    setFormulario(formularioVacio);
  };

  const handleEditar = (e: typeof enviosIniciales[0]) => {
    setFormulario({ numero: e.numero, pedido: e.pedido, cliente: e.cliente, direccion: e.direccion, fecha: e.fecha, estado: e.estado });
    setEditandoId(e.id);
  };

  const handleEliminar = (id: number) => {
    setEnvios(envios.filter((e) => e.id !== id));
    mostrarMensaje('Envio eliminado.');
  };

  const cambiarEstado = (id: number, nuevoEstado: string) => {
    setEnvios(envios.map((e) => e.id === id ? { ...e, estado: nuevoEstado } : e));
    mostrarMensaje('Estado actualizado.');
  };

  return (
    <>
    <Header />
    <div>
      <h2 className="titulo-envios">Gestion de Envios</h2>

      {mensaje && <div className="mensaje-envios">{mensaje}</div>}

      <div className="contenedor-envios">

        <div className="formulario-envios">
          <h2 className="subtitulo-envios">
            {editandoId !== null ? 'Editar envio' : 'Agregar envio'}
          </h2>

          <p className="label-envio">N° Envio</p>
          <input className="input-envio" name="numero" value={formulario.numero} onChange={handleCambio} placeholder="ENV-005" />

          <p className="label-envio">N° Pedido</p>
          <input className="input-envio" name="pedido" value={formulario.pedido} onChange={handleCambio} placeholder="PED-005" />

          <p className="label-envio">Cliente</p>
          <input className="input-envio" name="cliente" value={formulario.cliente} onChange={handleCambio} placeholder="Nombre del cliente" />

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

          <button className="btn-guardar-envio" onClick={handleGuardar}>
            {editandoId !== null ? 'Guardar cambios' : 'Agregar envio'}
          </button>

          {editandoId !== null && (
            <button className="btn-cancelar-envio" onClick={() => { setEditandoId(null); setFormulario(formularioVacio); }}>
              Cancelar
            </button>
          )}
        </div>

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
              <tr key={env.id}>
                <td className="numero-envio">{env.numero}</td>
                <td>{env.pedido}</td>
                <td className="cliente-envio">{env.cliente}</td>
                <td>{env.direccion}</td>
                <td>{env.fecha}</td>
                <td>
                  <select
                    value={env.estado}
                    onChange={(e) => cambiarEstado(env.id, e.target.value)}
                    className="estado-select"
                    style={{ backgroundColor: estadoColor[env.estado] || '#999' }}
                  >
                    <option value="Preparando">Preparando</option>
                    <option value="En camino">En camino</option>
                    <option value="Entregado">Entregado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </td>
                <td>
                  <button className="btn-editar-envio" onClick={() => handleEditar(env)}>Editar</button>
                  <button className="btn-eliminar-envio" onClick={() => handleEliminar(env.id)}>Eliminar</button>
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