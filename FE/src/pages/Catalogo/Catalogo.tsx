import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { API } from '../../api/api';
import './Catalogo.css';

const iconosPorCategoria: Record<string, string> = {
  Cuadernos:  '📓',
  Lapices:    '✏️',
  Colores:    '🎨',
  Arte:       '🖌️',
  Oficina:    '📁',
  Mochilas:   '🎒',
  Tecnologia: '💻',
  Papeleria:  '📄',
};

interface Producto {
  id_producto: number;
  nombre:      string;
  precio:      number;
  descripcion: string | null;
  stock:       number;
  categorias:  { nombre: string } | null;
}

export default function Catalogo() {
  const { agregar, items } = useCart();
  const navigate = useNavigate();

  const [productos, setProductos]           = useState<Producto[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [busqueda, setBusqueda]             = useState('');
  const [agregados, setAgregados]           = useState<number[]>([]);
  const [cargando, setCargando]             = useState(true);

  useEffect(() => {
    fetch(API.productos)
      .then(r => r.json())
      .then(data => { setProductos(data); setCargando(false); })
      .catch(() => setCargando(false));
  }, []);

  const categorias = ['Todos', ...Array.from(new Set(productos.map(p => p.categorias?.nombre ?? 'Otros')))];

  const filtrados = productos.filter(p => {
    const cat = p.categorias?.nombre ?? 'Otros';
    const matchCat  = categoriaActiva === 'Todos' || cat === categoriaActiva;
    const matchBusq = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return matchCat && matchBusq;
  });

  const handleAgregar = (p: Producto) => {
    agregar({
      id:       p.id_producto,
      nombre:   p.nombre,
      precio:   Number(p.precio),
      categoria: p.categorias?.nombre ?? 'Otros',
      icono:    iconosPorCategoria[p.categorias?.nombre ?? ''] ?? '📦',
    });
    setAgregados(prev => [...prev, p.id_producto]);
    setTimeout(() => setAgregados(prev => prev.filter(id => id !== p.id_producto)), 1200);
  };

  const cantidadEnCarrito = (id: number) =>
    items.find(i => i.id === id)?.cantidad ?? 0;

  return (
    <>
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
          {categorias.map(cat => (
            <button
              key={cat}
              className={`cat-btn ${categoriaActiva === cat ? 'cat-btn-activa' : ''}`}
              onClick={() => setCategoriaActiva(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {cargando ? (
          <p style={{ color: 'var(--text)', padding: '40px 0' }}>Cargando productos...</p>
        ) : filtrados.length === 0 ? (
          <div className="catalogo-vacio">
            <p>No se encontraron productos 😕</p>
          </div>
        ) : (
          <div className="catalogo-grid">
            {filtrados.map(prod => {
              const enCarrito      = cantidadEnCarrito(prod.id_producto);
              const recienAgregado = agregados.includes(prod.id_producto);
              const icono          = iconosPorCategoria[prod.categorias?.nombre ?? ''] ?? '📦';

              return (
                <div key={prod.id_producto} className="prod-card">
                  <span className="prod-cat-badge">{prod.categorias?.nombre ?? 'Otros'}</span>
                  <div className="prod-icono">{icono}</div>
                  <h3 className="prod-nombre">{prod.nombre}</h3>
                  <p className="prod-precio">${Number(prod.precio).toLocaleString()}</p>

                  {enCarrito > 0 && (
                    <p className="prod-en-carrito">✓ {enCarrito} en carrito</p>
                  )}

                  <button
                    className={`prod-btn-agregar ${recienAgregado ? 'prod-btn-ok' : ''}`}
                    onClick={() => handleAgregar(prod)}
                  >
                    {recienAgregado ? '✓ Agregado' : '🛒 Agregar al carrito'}
                  </button>

                  <button
                    className="prod-btn-ver"
                    onClick={() => navigate(`/producto/${prod.id_producto}`)}
                  >
                    Ver detalle
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