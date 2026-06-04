import { useState } from 'react';

const proveedoresIniciales = [
  { id: 1, nombre: 'Papeleria Nacional', contacto: 'Carlos Perez', correo: 'carlos@pnacional.com', telefono: '3001112222', productos: 'Cuadernos, Carpetas' },
  { id: 2, nombre: 'Colores y Arte', contacto: 'Maria Gomez', correo: 'maria@coloresarte.com', telefono: '3013334444', productos: 'Colores, Pinturas' },
  { id: 3, nombre: 'Utiles Express', contacto: 'Jorge Martinez', correo: 'jorge@utilesexpress.com', telefono: '3025556666', productos: 'Lapiceros, Borradores' },
  { id: 4, nombre: 'Mochilas y Mas', contacto: 'Ana Torres', correo: 'ana@mochilasmas.com', telefono: '3037778888', productos: 'Mochilas, Bolsos' },
];

export default function Proveedores() {
  const [proveedores, setProveedores] = useState(proveedoresIniciales);
  const [formulario, setFormulario] = useState({ nombre: '', contacto: '', correo: '', telefono: '', productos: '' });
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
    if (!formulario.nombre || !formulario.contacto || !formulario.correo || !formulario.telefono) {
      mostrarMensaje('Por favor completa todos los campos.');
      return;
    }
    if (editandoId !== null) {
      setProveedores(proveedores.map((p) => p.id === editandoId ? { ...p, ...formulario } : p));
      mostrarMensaje('Proveedor actualizado.');
      setEditandoId(null);
    } else {
      setProveedores([...proveedores, { id: Date.now(), ...formulario }]);
      mostrarMensaje('Proveedor agregado.');
    }
    setFormulario({ nombre: '', contacto: '', correo: '', telefono: '', productos: '' });
  };

  const handleEditar = (p: typeof proveedoresIniciales[0]) => {
    setFormulario({ nombre: p.nombre, contacto: p.contacto, correo: p.correo, telefono: p.telefono, productos: p.productos });
    setEditandoId(p.id);
  };

  const handleEliminar = (id: number) => {
    setProveedores(proveedores.filter((p) => p.id !== id));
    mostrarMensaje('Proveedor eliminado.');
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: '8px',
    border: '1px solid var(--border)', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box', marginBottom: '12px',
    color: 'var(--text-h)', backgroundColor: 'var(--bg)'
  };

  return (
    <div>
      <h2 style={{ color: 'var(--text-h)', marginBottom: '24px' }}>Gestion de Proveedores</h2>
      {mensaje && (
        <div style={{ backgroundColor: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: '8px', padding: '10px 16px', color: 'var(--accent)', fontSize: '14px', marginBottom: '20px' }}>
          {mensaje}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px' }}>
        <div style={{ backgroundColor: 'var(--accent-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--accent-border)', height: 'fit-content' }}>
          <h2 style={{ fontSize: '15px', marginBottom: '16px' }}>{editandoId !== null ? 'Editar proveedor' : 'Agregar proveedor'}</h2>
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text)' }}>Empresa</p>
          <input name="nombre" value={formulario.nombre} onChange={handleCambio} placeholder="Nombre de la empresa" style={inputStyle} />
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text)' }}>Contacto</p>
          <input name="contacto" value={formulario.contacto} onChange={handleCambio} placeholder="Nombre del contacto" style={inputStyle} />
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text)' }}>Correo</p>
          <input name="correo" value={formulario.correo} onChange={handleCambio} placeholder="correo@empresa.com" style={inputStyle} />
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text)' }}>Telefono</p>
          <input name="telefono" value={formulario.telefono} onChange={handleCambio} placeholder="Numero de telefono" style={inputStyle} />
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text)' }}>Productos que provee</p>
          <input name="productos" value={formulario.productos} onChange={handleCambio} placeholder="Ej: Cuadernos, Carpetas" style={inputStyle} />
          <button onClick={handleGuardar} style={{ backgroundColor: 'var(--accent)', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', width: '100%', marginBottom: '8px' }}>
            {editandoId !== null ? 'Guardar cambios' : 'Agregar proveedor'}
          </button>
          {editandoId !== null && (
            <button onClick={() => { setEditandoId(null); setFormulario({ nombre: '', contacto: '', correo: '', telefono: '', productos: '' }); }} style={{ backgroundColor: 'var(--bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)', padding: '10px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', width: '100%' }}>
              Cancelar
            </button>
          )}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Empresa</th>
              <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Contacto</th>
              <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Correo</th>
              <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Telefono</th>
              <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Productos</th>
              <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {proveedores.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px', color: 'var(--text-h)', fontWeight: 500 }}>{p.nombre}</td>
                <td style={{ padding: '10px', color: 'var(--text)' }}>{p.contacto}</td>
                <td style={{ padding: '10px', color: 'var(--text)' }}>{p.correo}</td>
                <td style={{ padding: '10px', color: 'var(--text)' }}>{p.telefono}</td>
                <td style={{ padding: '10px', color: 'var(--text)' }}>{p.productos}</td>
                <td style={{ padding: '10px' }}>
                  <button onClick={() => handleEditar(p)} style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', marginRight: '8px' }}>Editar</button>
                  <button onClick={() => handleEliminar(p.id)} style={{ backgroundColor: '#fff0f0', color: '#e74c3c', border: '1px solid #e74c3c', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}