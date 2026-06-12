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

export default function Productos() {
  const [productos, setProductos] = useState(productosIniciales);
  const [formulario, setFormulario] = useState({
    nombre: '',
    precio: '',
    stock: '',
    categoria: ''
  });

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState('');

  const mostrarMensaje = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(''), 2500);
  };

  const handleCambio = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value
    });
  };

  const handleGuardar = () => {
    if (
      !formulario.nombre ||
      !formulario.precio ||
      !formulario.stock ||
      !formulario.categoria
    ) {
      mostrarMensaje('Por favor completa todos los campos.');
      return;
    }

    if (editandoId !== null) {
      setProductos(
        productos.map((p) =>
          p.id === editandoId
            ? {
                ...p,
                nombre: formulario.nombre,
                precio: Number(formulario.precio),
                stock: Number(formulario.stock),
                categoria: formulario.categoria
              }
            : p
        )
      );

      mostrarMensaje('Producto actualizado correctamente.');
      setEditandoId(null);
    } else {
      setProductos([
        ...productos,
        {
          id: Date.now(),
          nombre: formulario.nombre,
          precio: Number(formulario.precio),
          stock: Number(formulario.stock),
          categoria: formulario.categoria
        }
      ]);

      mostrarMensaje('Producto agregado correctamente.');
    }

    setFormulario({
      nombre: '',
      precio: '',
      stock: '',
      categoria: ''
    });
  };

  const handleEditar = (prod: typeof productosIniciales[0]) => {
    setFormulario({
      nombre: prod.nombre,
      precio: String(prod.precio),
      stock: String(prod.stock),
      categoria: prod.categoria
    });

    setEditandoId(prod.id);
  };

  const handleEliminar = (id: number) => {
    setProductos(productos.filter((p) => p.id !== id));
    mostrarMensaje('Producto eliminado.');
  };

  return (
    <div>
      <h2 className="titulo-productos">
        Gestion de Productos
      </h2>

      {mensaje && (
        <div className="mensaje-productos">
          {mensaje}
        </div>
      )}

      <div className="contenedor-productos">

        <div className="formulario-productos">
          <h2 className="subtitulo-productos">
            {editandoId !== null
              ? 'Editar producto'
              : 'Agregar producto'}
          </h2>

          <p className="label-producto">Nombre</p>
          <input
            name="nombre"
            value={formulario.nombre}
            onChange={handleCambio}
            placeholder="Nombre del producto"
            className="input-producto"
          />

          <p className="label-producto">Precio</p>
          <input
            name="precio"
            type="number"
            value={formulario.precio}
            onChange={handleCambio}
            placeholder="Precio en pesos"
            className="input-producto"
          />

          <p className="label-producto">Stock</p>
          <input
            name="stock"
            type="number"
            value={formulario.stock}
            onChange={handleCambio}
            placeholder="Cantidad disponible"
            className="input-producto"
          />

          <p className="label-producto">Categoria</p>
          <select
            name="categoria"
            value={formulario.categoria}
            onChange={handleCambio}
            className="input-producto"
          >
            <option value="">Selecciona una categoria</option>

            {[
              'Cuadernos',
              'Colores',
              'Carpetas',
              'Lapiceros',
              'Mochilas',
              'Tijeras'
            ].map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button
            onClick={handleGuardar}
            className="btn-guardar-producto"
          >
            {editandoId !== null
              ? 'Guardar cambios'
              : 'Agregar producto'}
          </button>

          {editandoId !== null && (
            <button
              onClick={() => {
                setEditandoId(null);
                setFormulario({
                  nombre: '',
                  precio: '',
                  stock: '',
                  categoria: ''
                });
              }}
              className="btn-cancelar-producto"
            >
              Cancelar
            </button>
          )}
        </div>

        <div>
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
                  <td className="nombre-producto">
                    {prod.nombre}
                  </td>

                  <td>{prod.categoria}</td>

                  <td className="precio-producto">
                    ${prod.precio.toLocaleString()}
                  </td>

                  <td>{prod.stock}</td>

                  <td>
                    <button
                      onClick={() => handleEditar(prod)}
                      className="btn-editar-producto"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => handleEliminar(prod.id)}
                      className="btn-eliminar-producto"
                    >
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