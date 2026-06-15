import { useState } from 'react';
import './Productos.css';

const productosIniciales = [
  { id: 1, nombre: 'Cuaderno universitario', precio: 8500, stock: 50, categoria: 'Cuadernos' },
  { id: 2, nombre: 'Set de colores x12', precio: 12000, stock: 30, categoria: 'Colores' },
  { id: 3, nombre: 'Carpeta argollada', precio: 9500, stock: 40, categoria: 'Carpetas' },
  { id: 4, nombre: 'Lapicero azul x10', precio: 5000, stock: 100, categoria: 'Lapiceros' },
  { id: 5, nombre: 'Mochila escolar', precio: 45000, stock: 15, categoria: 'Mochilas' },
  { id: 6, nombre: 'Tijeras punta redonda', precio: 6500, stock: 60, categoria: 'Tijeras' },
];

const categorias = ['Cuadernos', 'Colores', 'Carpetas', 'Lapiceros', 'Mochilas', 'Tijeras'];

const formularioVacio = { nombre: '', precio: '', stock: '', categoria: '' };

export default function Productos() {
  const [productos, setProductos] = useState(productosIniciales);
  const [formulario, setFormulario] = useState(formularioVacio);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);

  const mostrarMensaje = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(''), 2500);
  };

  const handleCambio = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const abrirModalNuevo = () => {
    setFormulario(formularioVacio);
    setEditandoId(null);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEditandoId(null);
    setFormulario(formularioVacio);
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
      mostrarMensaje('Producto actualizado.');
    } else {
      setProductos([...productos, { id: Date.now(), nombre: formulario.nombre, precio: Number(formulario.precio), stock: Number(formulario.stock), categoria: formulario.categoria }]);
      mostrarMensaje('Producto agregado.');
    }
    cerrarModal();
  };

  const handleEditar = (prod: typeof productosIniciales[0]) => {
    setFormulario({ nombre: prod.nombre, precio: String(prod.precio), stock: String(prod.stock), categoria: prod.categoria });
    setEditandoId(prod.id);
    setModalAbierto(true);
  };

  const handleEliminar = (id: number) => {
    setProductos(productos.filter((p) => p.id !== id));
    mostrarMensaje('Producto eliminado.');
  };

  return (
    <>
      <div className="productos-page">

        <div className="productos-topbar">
          <h2 className="titulo-productos">Gestion de Productos</h2>
          <button className="btn-nuevo-producto" onClick={abrirModalNuevo}>
            + Nuevo producto
          </button>
        </div>

        {mensaje && <div className="mensaje-productos">{mensaje}</div>}

        <table className="tabla-productos">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoria</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((prod) => (
              <tr key={prod.id}>
                <td className="nombre-producto">{prod.nombre}</td>
                <td>{prod.categoria}</td>
                <td className="precio-producto">${prod.precio.toLocaleString()}</td>
                <td>{prod.stock}</td>
                <td>
                  <button className="btn-editar-producto" onClick={() => handleEditar(prod)}>Editar</button>
                  <button className="btn-eliminar-producto" onClick={() => handleEliminar(prod.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <div
          className="modal-overlay-producto"
          onClick={(e) => { if (e.target === e.currentTarget) cerrarModal(); }}
        >
          <div className="modal-productos">

            <div className="modal-header-producto">
              <h2 className="modal-titulo-producto">
                {editandoId !== null ? 'Editar producto' : 'Nuevo producto'}
              </h2>
              <button className="modal-cerrar-producto" onClick={cerrarModal}>✕</button>
            </div>

            <div className="modal-body-producto">
              <label className="label-producto">Nombre</label>
              <input className="input-producto" name="nombre" value={formulario.nombre} onChange={handleCambio} placeholder="Nombre del producto" />

              <label className="label-producto">Precio</label>
              <input className="input-producto" type="number" name="precio" value={formulario.precio} onChange={handleCambio} placeholder="Precio en pesos" />

              <label className="label-producto">Stock</label>
              <input className="input-producto" type="number" name="stock" value={formulario.stock} onChange={handleCambio} placeholder="Cantidad disponible" />

              <label className="label-producto">Categoria</label>
              <select className="input-producto" name="categoria" value={formulario.categoria} onChange={handleCambio}>
                <option value="">Selecciona una categoria</option>
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="modal-footer-producto">
              <button className="btn-guardar-producto" onClick={handleGuardar}>
                {editandoId !== null ? 'Guardar cambios' : 'Agregar producto'}
              </button>
              <button className="btn-cancelar-producto" onClick={cerrarModal}>
                Cancelar
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}