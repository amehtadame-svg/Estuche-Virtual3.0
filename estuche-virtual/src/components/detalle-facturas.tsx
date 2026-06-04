import { useState } from 'react';

const detallesIniciales = [
  { id: 1, factura: 'FAC-001', producto: 'Cuaderno universitario', cantidad: 2, precioUnitario: 8500 },
  { id: 2, factura: 'FAC-001', producto: 'Lapicero azul x10', cantidad: 1, precioUnitario: 5000 },
  { id: 3, factura: 'FAC-002', producto: 'Set de colores x12', cantidad: 1, precioUnitario: 12000 },
  { id: 4, factura: 'FAC-003', producto: 'Mochila escolar', cantidad: 1, precioUnitario: 45000 },
  { id: 5, factura: 'FAC-003', producto: 'Tijeras punta redonda', cantidad: 2, precioUnitario: 6500 },
  { id: 6, factura: 'FAC-004', producto: 'Carpeta argollada', cantidad: 3, precioUnitario: 9500 },
];

export default function DetalleFacturas() {
  const [detalles, setDetalles] = useState(detallesIniciales);
  const [formulario, setFormulario] = useState({ factura: '', producto: '', cantidad: '', precioUnitario: '' });
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState('');

  const mostrarMensaje = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(''), 2500);
  };

  const handleCambio = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const handleGuardar = () => {
    if (!formulario.factura || !formulario.producto || !formulario.cantidad || !formulario.precioUnitario) {
      mostrarMensaje('Por favor completa todos los campos.');
      return;
    }
    if (editandoId !== null) {
      setDetalles(detalles.map((d) => d.id === editandoId ? { ...d, factura: formulario.factura, producto: formulario.producto, cantidad: Number(formulario.cantidad), precioUnitario: Number(formulario.precioUnitario) } : d));
      mostrarMensaje('Detalle actualizado.');
      setEditandoId(null);
    } else {
      setDetalles([...detalles, { id: Date.now(), factura: formulario.factura, producto: formulario.producto, cantidad: Number(formulario.cantidad), precioUnitario: Number(formulario.precioUnitario) }]);
      mostrarMensaje('Detalle agregado.');
    }
    setFormulario({ factura: '', producto: '', cantidad: '', precioUnitario: '' });
  };

  const handleEditar = (d: typeof detallesIniciales[0]) => {
    setFormulario({ factura: d.factura, producto: d.producto, cantidad: String(d.cantidad), precioUnitario: String(d.precioUnitario) });
    setEditandoId(d.id);
  };

  const handleEliminar = (id: number) => {
    setDetalles(detalles.filter((d) => d.id !== id));
    mostrarMensaje('Detalle eliminado.');
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: '8px',
    border: '1px solid var(--border)', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box', marginBottom: '12px',
    color: 'var(--text-h)', backgroundColor: 'var(--bg)'
  };

  return (
    <div>
      <h2 style={{ color: 'var(--text-h)', marginBottom: '24px' }}>Detalle de Facturas</h2>
      {mensaje && (
        <div style={{ backgroundColor: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: '8px', padding: '10px 16px', color: 'var(--accent)', fontSize: '14px', marginBottom: '20px' }}>
          {mensaje}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px' }}>
        <div style={{ backgroundColor: 'var(--accent-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--accent-border)', height: 'fit-content' }}>
          <h2 style={{ fontSize: '15px', marginBottom: '16px' }}>{editandoId !== null ? 'Editar detalle' : 'Agregar detalle'}</h2>
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text)' }}>N° Factura</p>
          <input name="factura" value={formulario.factura} onChange={handleCambio} placeholder="Ej: FAC-001" style={inputStyle} />
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text)' }}>Producto</p>
          <input name="producto" value={formulario.producto} onChange={handleCambio} placeholder="Nombre del producto" style={inputStyle} />
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text)' }}>Cantidad</p>
          <input name="cantidad" type="number" value={formulario.cantidad} onChange={handleCambio} placeholder="Cantidad" style={inputStyle} />
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text)' }}>Precio unitario</p>
          <input name="precioUnitario" type="number" value={formulario.precioUnitario} onChange={handleCambio} placeholder="Precio en pesos" style={inputStyle} />
          <button onClick={handleGuardar} style={{ backgroundColor: 'var(--accent)', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', width: '100%', marginBottom: '8px' }}>
            {editandoId !== null ? 'Guardar cambios' : 'Agregar detalle'}
          </button>
          {editandoId !== null && (
            <button onClick={() => { setEditandoId(null); setFormulario({ factura: '', producto: '', cantidad: '', precioUnitario: '' }); }} style={{ backgroundColor: 'var(--bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)', padding: '10px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', width: '100%' }}>
              Cancelar
            </button>
          )}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>N° Factura</th>
              <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Producto</th>
              <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Cantidad</th>
              <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Precio unitario</th>
              <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Subtotal</th>
              <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {detalles.map((d) => (
              <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px', color: 'var(--accent)', fontWeight: 500 }}>{d.factura}</td>
                <td style={{ padding: '10px', color: 'var(--text-h)' }}>{d.producto}</td>
                <td style={{ padding: '10px', color: 'var(--text)' }}>{d.cantidad}</td>
                <td style={{ padding: '10px', color: 'var(--text)' }}>${d.precioUnitario.toLocaleString()}</td>
                <td style={{ padding: '10px', color: 'var(--accent)', fontWeight: 500 }}>${(d.cantidad * d.precioUnitario).toLocaleString()}</td>
                <td style={{ padding: '10px' }}>
                  <button onClick={() => handleEditar(d)} style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', marginRight: '8px' }}>Editar</button>
                  <button onClick={() => handleEliminar(d.id)} style={{ backgroundColor: '#fff0f0', color: '#e74c3c', border: '1px solid #e74c3c', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}