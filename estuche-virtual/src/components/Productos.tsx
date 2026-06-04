import { useState } from 'react';

const productosIniciales = [
  { id: 1, nombre: 'Cuaderno universitario', precio: 8500, stock: 50, categoria: 'Cuadernos' },
  { id: 2, nombre: 'Set de colores x12', precio: 12000, stock: 30, categoria: 'Colores' },
  { id: 3, nombre: 'Carpeta argollada', precio: 9500, stock: 40, categoria: 'Carpetas' },
  { id: 4, nombre: 'Lapicero azul x10', precio: 5000, stock: 100, categoria: 'Lapiceros' },
  { id: 5, nombre: 'Mochila escolar', precio: 45000, stock: 15, categoria: 'Mochilas' },
  { id: 6, nombre: 'Tijeras punta redonda', precio: 6500, stock: 60, categoria: 'Tijeras' },
];

export default function Productos() {

  const [productos, setProductos] = useState(productosIniciales);
  const [formulario, setFormulario] = useState({ nombre: '', precio: '', stock: '', categoria: '' });
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
    if (!formulario.nombre || !formulario.precio || !formulario.stock || !formulario.categoria) {
      mostrarMensaje('Por favor completa todos los campos.');
      return;
    }
    if (editandoId !== null) {
      setProductos(productos.map((p) =>
        p.id === editandoId
          ? { ...p, nombre: formulario.nombre, precio: Number(formulario.precio), stock: Number(formulario.stock), categoria: formulario.categoria }
          : p
      ));
      mostrarMensaje('Producto actualizado correctamente.');
      setEditandoId(null);
    } else {
      setProductos([...productos, {
        id: Date.now(),
        nombre: formulario.nombre,
        precio: Number(formulario.precio),
        stock: Number(formulario.stock),
        categoria: formulario.categoria
      }]);
      mostrarMensaje('Producto agregado correctamente.');
    }
    setFormulario({ nombre: '', precio: '', stock: '', categoria: '' });
  };

  const handleEditar = (prod: typeof productosIniciales[0]) => {
    setFormulario({ nombre: prod.nombre, precio: String(prod.precio), stock: String(prod.stock), categoria: prod.categoria });
    setEditandoId(prod.id);
  };

  const handleEliminar = (id: number) => {
    setProductos(productos.filter((p) => p.id !== id));
    mostrarMensaje('Producto eliminado.');
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: '12px',
    color: 'var(--text-h)',
    backgroundColor: 'var(--bg)'
  };

  return (
    <div>
      <h2 style={{ color: 'var(--text-h)', marginBottom: '24px' }}>Gestion de Productos</h2>

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

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px' }}>

        <div style={{
          backgroundColor: 'var(--accent-bg)',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid var(--accent-border)',
          height: 'fit-content'
        }}>
          <h2 style={{ fontSize: '15px', marginBottom: '16px' }}>
            {editandoId !== null ? 'Editar producto' : 'Agregar producto'}
          </h2>

          <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text)' }}>Nombre</p>
          <input name="nombre" value={formulario.nombre} onChange={handleCambio} placeholder="Nombre del producto" style={inputStyle} />

          <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text)' }}>Precio</p>
          <input name="precio" type="number" value={formulario.precio} onChange={handleCambio} placeholder="Precio en pesos" style={inputStyle} />

          <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text)' }}>Stock</p>
          <input name="stock" type="number" value={formulario.stock} onChange={handleCambio} placeholder="Cantidad disponible" style={inputStyle} />

          <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text)' }}>Categoria</p>
          <select name="categoria" value={formulario.categoria} onChange={handleCambio} style={inputStyle}>
            <option value="">Selecciona una categoria</option>
            {['Cuadernos', 'Colores', 'Carpetas', 'Lapiceros', 'Mochilas', 'Tijeras'].map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <button onClick={handleGuardar} style={{
            backgroundColor: 'var(--accent)',
            color: '#fff',
            border: 'none',
            padding: '10px',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer',
            width: '100%',
            marginBottom: '8px'
          }}>
            {editandoId !== null ? 'Guardar cambios' : 'Agregar producto'}
          </button>

          {editandoId !== null && (
            <button onClick={() => { setEditandoId(null); setFormulario({ nombre: '', precio: '', stock: '', categoria: '' }); }} style={{
              backgroundColor: 'var(--bg)',
              color: 'var(--accent)',
              border: '1px solid var(--accent-border)',
              padding: '10px',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              width: '100%'
            }}>
              Cancelar
            </button>
          )}
        </div>

        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Producto</th>
                <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Categoria</th>
                <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Precio</th>
                <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Stock</th>
                <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((prod) => (
                <tr key={prod.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px', color: 'var(--text-h)' }}>{prod.nombre}</td>
                  <td style={{ padding: '10px', color: 'var(--text)' }}>{prod.categoria}</td>
                  <td style={{ padding: '10px', color: 'var(--accent)', fontWeight: 500 }}>${prod.precio.toLocaleString()}</td>
                  <td style={{ padding: '10px', color: 'var(--text)' }}>{prod.stock}</td>
                  <td style={{ padding: '10px' }}>
                    <button onClick={() => handleEditar(prod)} style={{
                      backgroundColor: 'var(--accent-bg)',
                      color: 'var(--accent)',
                      border: '1px solid var(--accent-border)',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      marginRight: '8px'
                    }}>
                      Editar
                    </button>
                    <button onClick={() => handleEliminar(prod.id)} style={{
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

      </div>
    </div>
  );
}
