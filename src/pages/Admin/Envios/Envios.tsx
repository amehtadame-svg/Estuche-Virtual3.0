import { useState } from 'react';
import './Envios.css';

const enviosIniciales = [
  { id: 1, numero: 'ENV-001', pedido: 'PED-001', cliente: 'Valentina Lopez', direccion: 'Calle 10 # 5-20, Bogota', fecha: '2025-01-11', estado: 'Entregado' },
  { id: 2, numero: 'ENV-002', pedido: 'PED-002', cliente: 'Isabella Garcia', direccion: 'Carrera 7 # 45-30, Medellin', fecha: '2025-01-13', estado: 'En camino' },
  { id: 3, numero: 'ENV-003', pedido: 'PED-003', cliente: 'Camila Rodriguez', direccion: 'Av 6N # 23-15, Cali', fecha: '2025-01-15', estado: 'Entregado' },
  { id: 4, numero: 'ENV-004', pedido: 'PED-004', cliente: 'Lucia Torres', direccion: 'Calle 5 # 12-40, Barranquilla', fecha: '2025-01-17', estado: 'Preparando' },
];

const estadoColor: Record<string, string> = {
  'Entregado': '#27ae60',
  'En camino': '#f39c12',
  'Preparando': '#3498db',
  'Cancelado': '#e74c3c',
};

export default function Envios() {
  const [envios, setEnvios] = useState(enviosIniciales);
  const [mensaje, setMensaje] = useState('');

  const mostrarMensaje = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(''), 2500);
  };

  const cambiarEstado = (id: number, nuevoEstado: string) => {
    setEnvios(
      envios.map((e) =>
        e.id === id ? { ...e, estado: nuevoEstado } : e
      )
    );
    mostrarMensaje('Estado actualizado.');
  };

  const handleEliminar = (id: number) => {
    setEnvios(envios.filter((e) => e.id !== id));
    mostrarMensaje('Envio eliminado.');
  };

  return (
    <div>
      <h2 className="titulo-envios">Gestion de Envios</h2>

      {mensaje && (
        <div className="mensaje-envios">
          {mensaje}
        </div>
      )}

      <table className="tabla-envios">
        <thead>
          <tr>
            <th>N° Envio</th>
            <th>Pedido</th>
            <th>Cliente</th>
            <th>Direccion</th>
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
                  onChange={(e) =>
                    cambiarEstado(env.id, e.target.value)
                  }
                  className="estado-select"
                  style={{
                    backgroundColor:
                      estadoColor[env.estado] || '#999',
                  }}
                >
                  <option value="Preparando">Preparando</option>
                  <option value="En camino">En camino</option>
                  <option value="Entregado">Entregado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </td>

              <td>
                <button
                  onClick={() => handleEliminar(env.id)}
                  className="btn-eliminar-envio"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}