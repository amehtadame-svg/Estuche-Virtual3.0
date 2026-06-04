import { useState } from 'react';

const facturasIniciales = [
  { id: 1, numero: 'FAC-001', cliente: 'Valentina Lopez', fecha: '2025-01-10', total: 85000, estado: 'Pagada' },
  { id: 2, numero: 'FAC-002', cliente: 'Isabella Garcia', fecha: '2025-01-12', total: 47000, estado: 'Pendiente' },
  { id: 3, numero: 'FAC-003', cliente: 'Camila Rodriguez', fecha: '2025-01-14', total: 120000, estado: 'Pagada' },
  { id: 4, numero: 'FAC-004', cliente: 'Lucia Torres', fecha: '2025-01-16', total: 35000, estado: 'Pendiente' },
  { id: 5, numero: 'FAC-005', cliente: 'Antonella Ramirez', fecha: '2025-01-18', total: 53000, estado: 'Anulada' },
];

const estadoColor: Record<string, string> = {
  'Pagada': '#27ae60',
  'Pendiente': '#f39c12',
  'Anulada': '#e74c3c',
};

export default function Facturas() {
  const [facturas, setFacturas] = useState(facturasIniciales);
  const [mensaje, setMensaje] = useState('');

  const mostrarMensaje = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(''), 2500);
  };

  const cambiarEstado = (id: number, nuevoEstado: string) => {
    setFacturas(facturas.map((f) => f.id === id ? { ...f, estado: nuevoEstado } : f));
    mostrarMensaje('Estado actualizado.');
  };

  const handleEliminar = (id: number) => {
    setFacturas(facturas.filter((f) => f.id !== id));
    mostrarMensaje('Factura eliminada.');
  };

  return (
    <div>
      <h2 style={{ color: 'var(--text-h)', marginBottom: '24px' }}>Gestion de Facturas</h2>
      {mensaje && (
        <div style={{ backgroundColor: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: '8px', padding: '10px 16px', color: 'var(--accent)', fontSize: '14px', marginBottom: '20px' }}>
          {mensaje}
        </div>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border)' }}>
            <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>N° Factura</th>
            <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Cliente</th>
            <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Fecha</th>
            <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Total</th>
            <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Estado</th>
            <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {facturas.map((fac) => (
            <tr key={fac.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '10px', color: 'var(--accent)', fontWeight: 500 }}>{fac.numero}</td>
              <td style={{ padding: '10px', color: 'var(--text-h)' }}>{fac.cliente}</td>
              <td style={{ padding: '10px', color: 'var(--text)' }}>{fac.fecha}</td>
              <td style={{ padding: '10px', color: 'var(--text-h)', fontWeight: 500 }}>${fac.total.toLocaleString()}</td>
              <td style={{ padding: '10px' }}>
                <select value={fac.estado} onChange={(e) => cambiarEstado(fac.id, e.target.value)} style={{ padding: '4px 10px', borderRadius: '99px', border: 'none', fontSize: '12px', fontWeight: 500, color: '#fff', backgroundColor: estadoColor[fac.estado] || '#999', cursor: 'pointer', outline: 'none' }}>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Pagada">Pagada</option>
                  <option value="Anulada">Anulada</option>
                </select>
              </td>
              <td style={{ padding: '10px' }}>
                <button onClick={() => handleEliminar(fac.id)} style={{ backgroundColor: '#fff0f0', color: '#e74c3c', border: '1px solid #e74c3c', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}