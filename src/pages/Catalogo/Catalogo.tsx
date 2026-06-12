import { useState } from 'react';
import Header from '../../components/Header/Header';
import { useCart } from '../../context/CartContext';
import './Catalogo.css';

const todosLosProductos = [
  { id: 1,  nombre: 'Cuaderno universitario',   precio: 8500,  categoria: 'Cuadernos',  icono: '📓' },
  { id: 2,  nombre: 'Cuaderno cuadriculado',     precio: 7000,  categoria: 'Cuadernos',  icono: '📒' },
  { id: 3,  nombre: 'Set de colores x12',        precio: 12000, categoria: 'Colores',    icono: '🎨' },
  { id: 4,  nombre: 'Colores acuarelables x24',  precio: 18500, categoria: 'Colores',    icono: '🖌️' },
  { id: 5,  nombre: 'Carpeta argollada',         precio: 9500,  categoria: 'Carpetas',   icono: '📁' },
  { id: 6,  nombre: 'Carpeta plástica A4',       precio: 4500,  categoria: 'Carpetas',   icono: '🗂️' },
  { id: 7,  nombre: 'Lapicero azul x10',         precio: 5000,  categoria: 'Lapiceros',  icono: '🖊️' },
  { id: 8,  nombre: 'Lapicero negro x10',        precio: 5000,  categoria: 'Lapiceros',  icono: '✒️' },
  { id: 9,  nombre: 'Mochila escolar',           precio: 45000, categoria: 'Mochilas',   icono: '🎒' },
  { id: 10, nombre: 'Mochila ejecutiva',         precio: 65000, categoria: 'Mochilas',   icono: '💼' },
  { id: 11, nombre: 'Tijeras punta redonda',     precio: 6500,  categoria: 'Tijeras',    icono: '✂️' },
  { id: 12, nombre: 'Regla 30 cm',               precio: 2500,  categoria: 'Otros',      icono: '📏' },
  { id: 13, nombre: 'Borrador blanco',           precio: 1500,  categoria: 'Otros',      icono: '🔲' },
  { id: 14, nombre: 'Sacapuntas doble',          precio: 2000,  categoria: 'Otros',      icono: '🔧' },
  { id: 15, nombre: 'Resaltadores x5',           precio: 8000,  categoria: 'Otros',      icono: '🖍️' },
  { id: 16, nombre: 'Post-it colores x100',      precio: 9500,  categoria: 'Otros',      icono: '📌' },
];

const categorias = ['Todos', ...Array.from(new Set(todosLosProductos.map((p) => p.categoria)))];

export default function Catalogo() {
  const { agregar, items } = useCart();
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [agregados, setAgregados] = useState<number[]>([]);

  const filtrados = todosLosProductos.filter((p) => {
    const matchCat = categoriaActiva === 'Todos' || p.categoria === categoriaActiva;
    const matchBusq = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return matchCat && matchBusq;
  });

  const handleAgregar = (p: typeof todosLosProductos[0]) => {
    agregar(p);
    setAgregados((prev) => [...prev, p.id]);
    setTimeout(() => setAgregados((prev) => prev.filter((id) => id !== p.id)), 1200);
  };

  const cantidadEnCarrito = (id: number) =>
    items.find((i) => i.id === id)?.cantidad ?? 0;

  return (
    <>
      <Header />
      <div className="catalogo-container">

        <div className="catalogo-header">
          <div>
            <h1 className="catalogo-titulo">Catálogo de productos</h1>
            <p className="catalogo-subtitulo">{filtrados.length} productos disponibles</p>
          </div>

          <input
            className="catalogo-busqueda"
            placeholder="🔍  Buscar producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="catalogo-categorias">
          {categorias.map((cat) => (
            <button
              key={cat}
              className={`cat-btn ${categoriaActiva === cat ? 'cat-btn-activa' : ''}`}
              onClick={() => setCategoriaActiva(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {filtrados.length === 0 ? (
          <div className="catalogo-vacio">
            <p>No se encontraron productos 😕</p>
          </div>
        ) : (
          <div className="catalogo-grid">
            {filtrados.map((prod) => {
              const enCarrito = cantidadEnCarrito(prod.id);
              const recienAgregado = agregados.includes(prod.id);
              return (
                <div key={prod.id} className="prod-card">
                  <span className="prod-cat-badge">{prod.categoria}</span>
                  <div className="prod-icono">{prod.icono}</div>
                  <h3 className="prod-nombre">{prod.nombre}</h3>
                  <p className="prod-precio">${prod.precio.toLocaleString()}</p>

                  {enCarrito > 0 && (
                    <p className="prod-en-carrito">✓ {enCarrito} en carrito</p>
                  )}

                  <button
                    className={`prod-btn-agregar ${recienAgregado ? 'prod-btn-ok' : ''}`}
                    onClick={() => handleAgregar(prod)}
                  >
                    {recienAgregado ? '✓ Agregado' : '🛒 Agregar al carrito'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
