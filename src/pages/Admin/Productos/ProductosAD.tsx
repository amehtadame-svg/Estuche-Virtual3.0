import { useState, useEffect } from 'react';
import Modal from '../../../components/Modal/Modal';
import { API } from '../../../api';
import './Productos.css';

const categorias = ['Cuadernos', 'Colores', 'Carpetas', 'Lapiceros', 'Mochilas', 'Tijeras'];
const formularioVacio = { nombre: '', precio: '', stock: '', categoria: '', descripcion: '' };

interface Producto {
  id_producto: number;
  nombre: string;
  precio: number;
  descripcion: string | null;
  id_categoria: number | null;
  id_proveedor: number | null;
  categorias: { nombre: string } | null;
  inventario: { cantidad_actual: number } | null;
}

export default function Productos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [formulario, setFormulario] = useState(formularioVacio);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cargando, setCargando] = useState(true);

  const cargarProductos = () => {
    fetch(API.productos)
      .then(r => r.json())
      .then(data => { setProductos(data); setCargando(false); })
      .catch(() => { mostrarMensaje('Error al cargar productos.'); setCargando(false); });
  };

  useEffect(() => { cargarProductos(); }, []);

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

  const handleGuardar = async () => {
    if (!formulario.nombre || !formulario.precio || !formulario.stock) {
      mostrarMensaje('Por favor completa todos los campos.');
      return;
    }

    const body = {
      nombre: formulario.nombre,
      precio: Number(formulario.precio),
      stock: Number(formulario.stock),
      descripcion: formulario.descripcion,
      categoria: formulario.categoria,
    };

    if (editandoId !== null) {
      await fetch(`${API.productos}/${editandoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      mostrarMensaje('Producto actualizado.');
    } else {
      await fetch(API.productos, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      mostrarMensaje('Producto agregado.');
    }

    cargarProductos();
    cerrarModal();
  };

  const handleEditar = (prod: Producto) => {
    setFormulario({
      nombre: prod.nombre,
      precio: String(prod.precio),
      stock: String(prod.inventario?.cantidad_actual ?? 0),
      categoria: prod.categorias?.nombre ?? '',
      descripcion: prod.descripcion ?? '',
    });
    setEditandoId(prod.id_producto);
    setModalAbierto(true);
  };

  const handleEliminar = async (id: number) => {
    await fetch(`${API.productos}/${id}`, { method: 'DELETE' });
    setProductos(productos.filter(p => p.id_producto !== id));
    mostrarMensaje('Producto eliminado.');
  };

  return (
    <>
      <div className="productos-page">

        <div className="productos-topbar">
          <h2 className="titulo-productos">Gestion de Productos</h2>
          <p className="subtitulo-usuarios">Administra los Productos registrados</p>
          <button className="btn-nuevo-producto" onClick={abrirModalNuevo}>
            + Nuevo producto
          </button>
        </div>

        {mensaje && <div className="mensaje-productos">{mensaje}</div>}

        {cargando ? (
          <p style={{ color: 'var(--text)', padding: '20px 0' }}>Cargando productos...</p>
        ) : (
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
                <tr key={prod.id_producto}>
                  <td className="nombre-producto">{prod.nombre}</td>
                  <td>{prod.categorias?.nombre ?? '—'}</td>
                  <td className="precio-producto">${Number(prod.precio).toLocaleString()}</td>
                  <td>{prod.inventario?.cantidad_actual ?? 0}</td>
                  <td>
                    <button className="btn-editar-producto" onClick={() => handleEditar(prod)}>Editar</button>
                    <button className="btn-eliminar-producto" onClick={() => handleEliminar(prod.id_producto)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalAbierto && (
        <Modal
          titulo={editandoId !== null ? 'Editar producto' : 'Nuevo producto'}
          onClose={cerrarModal}
          footer={
            <>
              <button className="btn-cancelar-producto" onClick={cerrarModal}>Cancelar</button>
              <button className="btn-guardar-producto" onClick={handleGuardar}>
                {editandoId !== null ? 'Guardar cambios' : 'Agregar producto'}
              </button>
            </>
          }
        >
          <label className="label-producto">Nombre</label>
          <input className="input-producto" name="nombre" value={formulario.nombre} onChange={handleCambio} placeholder="Nombre del producto" />

          <label className="label-producto">Descripcion</label>
          <input className="input-producto" name="descripcion" value={formulario.descripcion} onChange={handleCambio} placeholder="Descripcion del producto" />

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
        </Modal>
      )}
    </>
  );
}