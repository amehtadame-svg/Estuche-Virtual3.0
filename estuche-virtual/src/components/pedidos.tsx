import { useState } from 'react';

const pedidosIniciales = [
  { id: 1, numero: 'PED-001', cliente: 'Valentina Lopez', fecha: '2025-01-10', total: 85000, estado: 'Entregado' },
  { id: 2, numero: 'PED-002', cliente: 'Isabella Garcia', fecha: '2025-01-12', total: 47000, estado: 'En camino' },
  { id: 3, numero: 'PED-003', cliente: 'Camila Rodriguez', fecha: '2025-01-14', total: 120000, estado: 'Entregado' },
  { id: 4, numero: 'PED-004', cliente: 'Lucia Torres', fecha: '2025-01-16', total: 35000, estado: 'Procesando' },
  { id: 5, numero: 'PED-005', cliente: 'Antonella Ramirez', fecha: '2025-01-18', total: 53000, estado: 'Cancelado' },
];

const estadoColor: Record<string, string> = {
  'Entregado': '#27ae60',
  'En camino': '#f39c12',
  'Procesando': '#3498db',
  'Cancelado': '#e74c3c',
};

export default function Pedidos() {

  const [pedidos, setPedidos] = useState(pedidosIniciales);
  const [mensaje, setMensaje] = useState('');

  const mostrarMensaje = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(''), 2500);
  };

  const cambiarEstado = (id: number, nuevoEstado: string) => {
    setPedidos(pedidos.map((p) => p.id === id ? { ...p, estado: nuevoEstado } : p));
    mostrarMensaje('Estado actualizado correctamente.');
  };

  const handleEliminar = (id: number) => {
    setPedidos(pedidos.filter((p) => p.id !== id));
    mostrarMensaje('Pedido eliminado.');
  };

  return (
    <div>
      <h2 style={{ color: 'var(--text-h)', marginBottom: '24px' }}>Gestion de Pedidos</h2>

      {mensaje && (
        <div style={{
          backgroundColor: 'var(--accent-bg)',
          border: '1px solid var(--accent-border)',
          borderRadius: '8px',
          padding: '10px 16px',
          color: 'var(--accent)',
          fontSize: '14px',
          marginBottom: '20px'
        }}>
          {mensaje}
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border)' }}>
            <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>N° Pedido</th>
            <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Cliente</th>
            <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Fecha</th>
            <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Total</th>
            <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Estado</th>
            <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((ped) => (
            <tr key={ped.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '10px', color: 'var(--accent)', fontWeight: 500 }}>{ped.numero}</td>
              <td style={{ padding: '10px', color: 'var(--text-h)' }}>{ped.cliente}</td>
              <td style={{ padding: '10px', color: 'var(--text)' }}>{ped.fecha}</td>
              <td style={{ padding: '10px', color: 'var(--text-h)', fontWeight: 500 }}>${ped.total.toLocaleString()}</td>
              <td style={{ padding: '10px' }}>
                <select
                  value={ped.estado}
                  onChange={(e) => cambiarEstado(ped.id, e.target.value)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '99px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#fff',
                    backgroundColor: estadoColor[ped.estado] || '#999',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="Procesando">Procesando</option>
                  <option value="En camino">En camino</option>
                  <option value="Entregado">Entregado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </td>
              <td style={{ padding: '10px' }}>
                <button onClick={() => handleEliminar(ped.id)} style={{
                  backgroundColor: '#fff0f0',
                  color: '#e74c3c',
                  border: '1px solid #e74c3c',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}>
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