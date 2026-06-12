import { useState } from 'react';
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

export default function Pedidos() {
  const [pedidos, setPedidos] = useState(pedidosIniciales);
  const [mensaje, setMensaje] = useState('');

  const mostrarMensaje = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(''), 2500);
  };

  const cambiarEstado = (id: number, nuevoEstado: string) => {
    setPedidos(
      pedidos.map((p) =>
        p.id === id ? { ...p, estado: nuevoEstado } : p
      )
    );
    mostrarMensaje('Estado actualizado correctamente.');
  };

  const handleEliminar = (id: number) => {
    setPedidos(pedidos.filter((p) => p.id !== id));
    mostrarMensaje('Pedido eliminado.');
  };

  return (
    <div>
      <h2 className="titulo-pedidos">
        Gestion de Pedidos
      </h2>

      {mensaje && (
        <div className="mensaje-pedidos">
          {mensaje}
        </div>
      )}

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
              <td className="total-pedido">
                ${ped.total.toLocaleString()}
              </td>

              <td>
                <select
                  value={ped.estado}
                  onChange={(e) =>
                    cambiarEstado(ped.id, e.target.value)
                  }
                  className="estado-select-pedido"
                  style={{
                    backgroundColor:
                      estadoColor[ped.estado] || '#999',
                  }}
                >
                  <option value="Procesando">Procesando</option>
                  <option value="En camino">En camino</option>
                  <option value="Entregado">Entregado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </td>

              <td>
                <button
                  onClick={() => handleEliminar(ped.id)}
                  className="btn-eliminar-pedido"
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