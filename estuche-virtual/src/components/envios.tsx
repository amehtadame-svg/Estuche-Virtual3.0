import { useState } from 'react';

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
    setEnvios(envios.map((e) => e.id === id ? { ...e, estado: nuevoEstado } : e));
    mostrarMensaje('Estado actualizado.');
  };

  const handleEliminar = (id: number) => {
    setEnvios(envios.filter((e) => e.id !== id));
    mostrarMensaje('Envio eliminado.');
  };

  return (
    <div>
      <h2 style={{ color: 'var(--text-h)', marginBottom: '24px' }}>Gestion de Envios</h2>
      {mensaje && (
        <div style={{ backgroundColor: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: '8px', padding: '10px 16px', color: 'var(--accent)', fontSize: '14px', marginBottom: '20px' }}>
          {mensaje}
        </div>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border)' }}>
            <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>N° Envio</th>
            <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Pedido</th>
            <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Cliente</th>
            <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Direccion</th>
            <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Fecha</th>
            <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Estado</th>
            <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {envios.map((env) => (
            <tr key={env.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '10px', color: 'var(--accent)', fontWeight: 500 }}>{env.numero}</td>
              <td style={{ padding: '10px', color: 'var(--text)' }}>{env.pedido}</td>
              <td style={{ padding: '10px', color: 'var(--text-h)' }}>{env.cliente}</td>
              <td style={{ padding: '10px', color: 'var(--text)' }}>{env.direccion}</td>
              <td style={{ padding: '10px', color: 'var(--text)' }}>{env.fecha}</td>
              <td style={{ padding: '10px' }}>
                <select value={env.estado} onChange={(e) => cambiarEstado(env.id, e.target.value)} style={{ padding: '4px 10px', borderRadius: '99px', border: 'none', fontSize: '12px', fontWeight: 500, color: '#fff', backgroundColor: estadoColor[env.estado] || '#999', cursor: 'pointer', outline: 'none' }}>
                  <option value="Preparando">Preparando</option>
                  <option value="En camino">En camino</option>
                  <option value="Entregado">Entregado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </td>
              <td style={{ padding: '10px' }}>
                <button onClick={() => handleEliminar(env.id)} style={{ backgroundColor: '#fff0f0', color: '#e74c3c', border: '1px solid #e74c3c', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}