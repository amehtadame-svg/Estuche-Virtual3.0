import { useState } from 'react';

const adminsIniciales = [
  { id: 1, nombre: 'Carlos', apellido: 'Mendoza', correo: 'carlos@Estuche.com', telefono: '3001112222', rol: 'Super Admin' },
  { id: 2, nombre: 'Diana', apellido: 'Perez', correo: 'diana@Estuche.com', telefono: '3013334444', rol: 'Admin' },
  { id: 3, nombre: 'Andres', apellido: 'Gomez', correo: 'andres@Estuche.com', telefono: '3025556666', rol: 'Admin' },
  { id: 4, nombre: 'Laura', apellido: 'Castillo', correo: 'laura@Estuche.com', telefono: '3037778888', rol: 'Moderador' },
];

export default function Administradores() {
  const [admins, setAdmins] = useState(adminsIniciales);
  const [formulario, setFormulario] = useState({ nombre: '', apellido: '', correo: '', telefono: '', rol: 'Admin' });
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
      setAdmins(admins.map((a) => a.id === editandoId ? { ...a, ...formulario } : a));
      mostrarMensaje('Administrador actualizado.');
      setEditandoId(null);
    } else {
      setAdmins([...admins, { id: Date.now(), ...formulario }]);
      mostrarMensaje('Administrador agregado.');
    }
    setFormulario({ nombre: '', apellido: '', correo: '', telefono: '', rol: 'Admin' });
  };

  const handleEditar = (a: typeof adminsIniciales[0]) => {
    setFormulario({ nombre: a.nombre, apellido: a.apellido, correo: a.correo, telefono: a.telefono, rol: a.rol });
    setEditandoId(a.id);
  };

  const handleEliminar = (id: number) => {
    setAdmins(admins.filter((a) => a.id !== id));
    mostrarMensaje('Administrador eliminado.');
  };

  const rolColor: Record<string, string> = {
    'Super Admin': '#e74c3c',
    'Admin': 'var(--accent)',
    'Moderador': '#f39c12',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: '8px',
    border: '1px solid var(--border)', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box', marginBottom: '12px',
    color: 'var(--text-h)', backgroundColor: 'var(--bg)'
  };

  return (
    <div>
      <h2 style={{ color: 'var(--text-h)', marginBottom: '24px' }}>Gestion de Administradores</h2>
      {mensaje && (
        <div style={{ backgroundColor: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: '8px', padding: '10px 16px', color: 'var(--accent)', fontSize: '14px', marginBottom: '20px' }}>
          {mensaje}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px' }}>
        <div style={{ backgroundColor: 'var(--accent-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--accent-border)', height: 'fit-content' }}>
          <h2 style={{ fontSize: '15px', marginBottom: '16px' }}>{editandoId !== null ? 'Editar admin' : 'Agregar admin'}</h2>
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text)' }}>Nombre</p>
          <input name="nombre" value={formulario.nombre} onChange={handleCambio} placeholder="Nombre" style={inputStyle} />
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text)' }}>Apellido</p>
          <input name="apellido" value={formulario.apellido} onChange={handleCambio} placeholder="Apellido" style={inputStyle} />
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text)' }}>Correo</p>
          <input name="correo" value={formulario.correo} onChange={handleCambio} placeholder="correo@estuche.com" style={inputStyle} />
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text)' }}>Telefono</p>
          <input name="telefono" value={formulario.telefono} onChange={handleCambio} placeholder="Numero de telefono" style={inputStyle} />
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text)' }}>Rol</p>
          <select name="rol" value={formulario.rol} onChange={handleCambio} style={inputStyle}>
            <option value="Super Admin">Super Admin</option>
            <option value="Admin">Admin</option>
            <option value="Moderador">Moderador</option>
          </select>
          <button onClick={handleGuardar} style={{ backgroundColor: 'var(--accent)', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', width: '100%', marginBottom: '8px' }}>
            {editandoId !== null ? 'Guardar cambios' : 'Agregar admin'}
          </button>
          {editandoId !== null && (
            <button onClick={() => { setEditandoId(null); setFormulario({ nombre: '', apellido: '', correo: '', telefono: '', rol: 'Admin' }); }} style={{ backgroundColor: 'var(--bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)', padding: '10px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', width: '100%' }}>
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
            {admins.map((a) => (
              <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px', color: 'var(--text-h)' }}>{a.nombre}</td>
                <td style={{ padding: '10px', color: 'var(--text)' }}>{a.apellido}</td>
                <td style={{ padding: '10px', color: 'var(--text)' }}>{a.correo}</td>
                <td style={{ padding: '10px', color: 'var(--text)' }}>{a.telefono}</td>
                <td style={{ padding: '10px' }}>
                  <span style={{ backgroundColor: rolColor[a.rol] ? `${rolColor[a.rol]}20` : 'var(--accent-bg)', color: rolColor[a.rol] || 'var(--accent)', padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 500 }}>{a.rol}</span>
                </td>
                <td style={{ padding: '10px' }}>
                  <button onClick={() => handleEditar(a)} style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', marginRight: '8px' }}>Editar</button>
                  <button onClick={() => handleEliminar(a.id)} style={{ backgroundColor: '#fff0f0', color: '#e74c3c', border: '1px solid #e74c3c', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}