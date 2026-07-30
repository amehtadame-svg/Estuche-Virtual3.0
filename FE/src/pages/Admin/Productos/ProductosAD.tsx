import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import { API } from '../../../api/api';
import './Productos.css';

const categorias = ['Cuadernos', 'Colores', 'Carpetas', 'Lapiceros', 'Mochilas', 'Tijeras'];
const formularioVacio = { nombre: '', precio: '', stock: '', stock_minimo: '', categoria: '', descripcion: '' };

interface Producto {
  id_producto:  number;
  nombre:       string;
  precio:       number;
  descripcion:  string | null;
  stock:        number;
  stock_minimo: number;
  id_categoria: number | null;
  id_proveedor: number | null;
  categorias:   { nombre: string } | null;
  proveedores:  { nombre: string } | null;
}

export default function Productos() {
  const [productos, setProductos]       = useState<Producto[]>([]);
  const [filtrados, setFiltrados]       = useState<Producto[]>([]);
  const [formulario, setFormulario]     = useState(formularioVacio);
  const [editandoId, setEditandoId]     = useState<number | null>(null);
  const [mensaje, setMensaje]           = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cargando, setCargando]         = useState(true);
  const [busqueda, setBusqueda]         = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');

  const cargarProductos = () => {
    fetch(API.productos)
      .then(r => r.json())
      .then(data => {
        setProductos(data);
        setFiltrados(data);
        setCargando(false);
      })
      .catch(() => { mostrarMensaje('Error al cargar productos.'); setCargando(false); });
  };

  useEffect(() => { cargarProductos(); }, []);

  useEffect(() => {
    let resultado = productos;

    if (busqueda) {
      resultado = resultado.filter(p =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    if (categoriaFiltro) {
      resultado = resultado.filter(p =>
        p.categorias?.nombre === categoriaFiltro
      );
    }

    setFiltrados(resultado);
  }, [busqueda, categoriaFiltro, productos]);

  const mostrarMensaje = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(''), 2500);
  };

  const handleCambio = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
      nombre:       formulario.nombre,
      precio:       Number(formulario.precio),
      stock:        Number(formulario.stock),
      stock_minimo: Number(formulario.stock_minimo) || 5,
      descripcion:  formulario.descripcion,
      categoria:    formulario.categoria,
    };

    if (editandoId !== null) {
      await fetch(`${API.productos}/${editandoId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      mostrarMensaje('Producto actualizado.');
    } else {
      await fetch(API.productos, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      mostrarMensaje('Producto agregado.');
    }

    cargarProductos();
    cerrarModal();
  };

  const handleEditar = (prod: Producto) => {
    setFormulario({
      nombre:       prod.nombre,
      precio:       String(prod.precio),
      stock:        String(prod.stock ?? 0),
      stock_minimo: String(prod.stock_minimo ?? 5),
      categoria:    prod.categorias?.nombre ?? '',
      descripcion:  prod.descripcion ?? '',
    });
    setEditandoId(prod.id_producto);
    setModalAbierto(true);
  };

  const handleEliminar = async (id: number) => {
    await fetch(`${API.productos}/${id}`, { method: 'DELETE' });
    setProductos(productos.filter(p => p.id_producto !== id));
    mostrarMensaje('Producto eliminado.');
  };

  const stockBajo = (prod: Producto) => prod.stock <= prod.stock_minimo;

  return (
    <>
      <div className="productos-page">

        <div className="productos-topbar">
          <div>
            <h2 className="titulo-productos">Gestion de Productos</h2>
            <p className="subtitulo-usuarios">Administra los Productos registrados</p>
          </div>
          <button className="btn-nuevo-producto" onClick={abrirModalNuevo}>
            + Nuevo producto
          </button>
        </div>

        <div className="productos-filtros">
          <input
            className="productos-busqueda"
            placeholder="🔍 Buscar producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <select
            className="productos-filtro-cat"
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
          >
            <option value="">categorías</option>
            {categorias.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {mensaje && <div className="mensaje-productos">{mensaje}</div>}

        {cargando ? (
          <p style={{ color: 'var(--text)', padding: '20px 0' }}>Cargando productos...</p>
        ) : (
          <table className="tabla-productos">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Descripción</th>
                <th>Categoría</th>
                <th>Proveedor</th>
                <th>Precio C/U</th>
                <th>Stock</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((prod) => (
                <tr key={prod.id_producto}>
                  <td className="nombre-producto">{prod.nombre}</td>
                  <td className="desc-producto">{prod.descripcion ?? '—'}</td>
                  <td>{prod.categorias?.nombre ?? '—'}</td>
                  <td>{prod.proveedores?.nombre ?? '—'}</td>
                  <td className="precio-producto">${Number(prod.precio).toLocaleString()}</td>
                  <td>
                    <span className={`stock-badge ${stockBajo(prod) ? 'stock-bajo' : 'stock-ok'}`}>
                      {prod.stock ?? 0}
                      {stockBajo(prod) && ' ⚠ bajo'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-editar-producto"   onClick={() => handleEditar(prod)}>Editar</button>
                    <button className="btn-eliminar-producto" onClick={() => handleEliminar(prod.id_producto)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {filtrados.length === 0 && !cargando && (
          <p className="productos-vacio">No se encontraron productos.</p>
        )}

      </div>

      {modalAbierto && (
        <Modal
          titulo={editandoId !== null ? 'Editar producto' : 'Nuevo producto'}
          onClose={cerrarModal}
          footer={
            <>
              <button className="btn-cancelar-producto" onClick={cerrarModal}>Cancelar</button>
              <button className="btn-guardar-producto"  onClick={handleGuardar}>
                {editandoId !== null ? 'Guardar cambios' : 'Agregar producto'}
              </button>
            </>
          }
        >
          <label className="label-producto">Nombre</label>
          <input
            className="input-producto"
            name="nombre"
            value={formulario.nombre}
            onChange={handleCambio}
            placeholder="Nombre del producto"
          />

          <label className="label-producto">Descripción</label>
          <textarea
            className="input-producto"
            name="descripcion"
            value={formulario.descripcion}
            onChange={handleCambio}
            placeholder="Descripción del producto"
            rows={3}
          />

          <label className="label-producto">Precio</label>
          <input
            className="input-producto"
            type="number"
            name="precio"
            value={formulario.precio}
            onChange={handleCambio}
            placeholder="Precio en pesos"
          />

          <label className="label-producto">Stock actual</label>
          <input
            className="input-producto"
            type="number"
            name="stock"
            value={formulario.stock}
            onChange={handleCambio}
            placeholder="Cantidad disponible"
          />

          <label className="label-producto">Stock mínimo</label>
          <input
            className="input-producto"
            type="number"
            name="stock_minimo"
            value={formulario.stock_minimo}
            onChange={handleCambio}
            placeholder="Cantidad mínima antes de reabastecer"
          />

          <label className="label-producto">Categoría</label>
          <select
            className="input-producto"
            name="categoria"
            value={formulario.categoria}
            onChange={handleCambio}
          >
            <option value="">Selecciona una categoría</option>
            {categorias.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </Modal>
      )}
    </>
  );
}