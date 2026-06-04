import { useState } from 'react';

const usuariosIniciales = [
  { id: 1, nombre: 'Valentina', apellido: 'Lopez', correo: 'valentina@Estuche.com', telefono: '3001234567', rol: 'Cliente' },
  { id: 2, nombre: 'Isabella', apellido: 'Garcia', correo: 'isabella@Estuche.com', telefono: '3009876543', rol: 'Cliente' },
  { id: 3, nombre: 'Camila', apellido: 'Rodriguez', correo: 'camila@Estuche.com', telefono: '3011112222', rol: 'Admin' },
  { id: 4, nombre: 'Mariana', apellido: 'Martinez', correo: 'mariana@Estuche.com', telefono: '3023334444', rol: 'Cliente' },
  { id: 5, nombre: 'Sofia', apellido: 'Hernandez', correo: 'sofia@Estuche.com', telefono: '3035556666', rol: 'Cliente' },
];

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState(usuariosIniciales);
  const [formulario, setFormulario] = useState({ nombre: '', apellido: '', correo: '', telefono: '', rol: 'Cliente' });
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
    if (!formulario.nombre || !formulario.apellido || !formulario.correo || !formulario.telefono) {
      mostrarMensaje('Por favor completa todos los campos.');
      return;
    }
    if (editandoId !== null) {
      setUsuarios(usuarios.map((u) => u.id === editandoId ? { ...u, ...formulario } : u));
      mostrarMensaje('Usuario actualizado.');
      setEditandoId(null);
    } else {
      setUsuarios([...usuarios, { id: Date.now(), ...formulario }]);
      mostrarMensaje('Usuario agregado.');
    }
    setFormulario({ nombre: '', apellido: '', correo: '', telefono: '', rol: 'Cliente' });
  };

  const handleEditar = (u: typeof usuariosIniciales[0]) => {
    setFormulario({ nombre: u.nombre, apellido: u.apellido, correo: u.correo, telefono: u.telefono, rol: u.rol });
    setEditandoId(u.id);
  };

  const handleEliminar = (id: number) => {
    setUsuarios(usuarios.filter((u) => u.id !== id));
    mostrarMensaje('Usuario eliminado.');
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: '8px',
    border: '1px solid var(--border)', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box', marginBottom: '12px',
    color: 'var(--text-h)', backgroundColor: 'var(--bg)'
  };

  return (
    <div>
      <h2 style={{ color: 'var(--text-h)', marginBottom: '24px' }}>Gestion de Usuarios</h2>
      {mensaje && (
        <div style={{ backgroundColor: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: '8px', padding: '10px 16px', color: 'var(--accent)', fontSize: '14px', marginBottom: '20px' }}>
          {mensaje}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px' }}>
        <div style={{ backgroundColor: 'var(--accent-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--accent-border)', height: 'fit-content' }}>
          <h2 style={{ fontSize: '15px', marginBottom: '16px' }}>{editandoId !== null ? 'Editar usuario' : 'Agregar usuario'}</h2>
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text)' }}>Nombre</p>
          <input name="nombre" value={formulario.nombre} onChange={handleCambio} placeholder="Nombre" style={inputStyle} />
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text)' }}>Apellido</p>
          <input name="apellido" value={formulario.apellido} onChange={handleCambio} placeholder="Apellido" style={inputStyle} />
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text)' }}>Correo</p>
          <input name="correo" value={formulario.correo} onChange={handleCambio} placeholder="correo@email.com" style={inputStyle} />
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text)' }}>Telefono</p>
          <input name="telefono" value={formulario.telefono} onChange={handleCambio} placeholder="Numero de telefono" style={inputStyle} />
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text)' }}>Rol</p>
          <select name="rol" value={formulario.rol} onChange={handleCambio} style={inputStyle}>
            <option value="Cliente">Cliente</option>
            <option value="Admin">Admin</option>
            <option value="Proveedor">Proveedor</option>
          </select>
          <button onClick={handleGuardar} style={{ backgroundColor: 'var(--accent)', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', width: '100%', marginBottom: '8px' }}>
            {editandoId !== null ? 'Guardar cambios' : 'Agregar usuario'}
          </button>
          {editandoId !== null && (
            <button onClick={() => { setEditandoId(null); setFormulario({ nombre: '', apellido: '', correo: '', telefono: '', rol: 'Cliente' }); }} style={{ backgroundColor: 'var(--bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)', padding: '10px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', width: '100%' }}>
              Cancelar
            </button>
          )}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Nombre</th>
              <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Apellido</th>
              <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Correo</th>
              <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Telefono</th>
              <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Rol</th>
              <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px', color: 'var(--text-h)' }}>{u.nombre}</td>
                <td style={{ padding: '10px', color: 'var(--text)' }}>{u.apellido}</td>
                <td style={{ padding: '10px', color: 'var(--text)' }}>{u.correo}</td>
                <td style={{ padding: '10px', color: 'var(--text)' }}>{u.telefono}</td>
                <td style={{ padding: '10px' }}>
                  <span style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent)', padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 500 }}>{u.rol}</span>
                </td>
                <td style={{ padding: '10px' }}>
                  <button onClick={() => handleEditar(u)} style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', marginRight: '8px' }}>Editar</button>
                  <button onClick={() => handleEliminar(u.id)} style={{ backgroundColor: '#fff0f0', color: '#e74c3c', border: '1px solid #e74c3c', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}