import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { API } from '../../api/api';
import './Catalog.css';

const iconsByCategory: Record<string, string> = {
  Cuadernos: '📓',
  Lapices: '✏️',
  Colores: '🎨',
  Arte: '🖌️',
  Oficina: '📁',
  Mochilas: '🎒',
  Tecnologia: '💻',
  Papeleria: '📄',
};

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  stock: number;
  category: { name: string } | null;
}

export default function Catalog() {
  const { add, items } = useCart();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [search, setSearch] = useState('');
  const [recentlyAdded, setRecentlyAdded] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API.products)
      .then((r) => r.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const categories = ['Todos', ...Array.from(new Set(products.map((p) => p.category?.name ?? 'Otros')))];

  const filtered = products.filter((p) => {
    const cat = p.category?.name ?? 'Otros';
    const matchCat = activeCategory === 'Todos' || cat === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleAdd = (p: Product) => {
    add({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      category: p.category?.name ?? 'Otros',
      icon: iconsByCategory[p.category?.name ?? ''] ?? '📦',
    });
    setRecentlyAdded((prev) => [...prev, p.id]);
    setTimeout(() => setRecentlyAdded((prev) => prev.filter((id) => id !== p.id)), 1200);
  };

  const quantityInCart = (id: string) => items.find((i) => i.id === id)?.quantity ?? 0;

  return (
    <>
      <div className="catalogo-container">
        <div className="catalogo-header">
          <div>
            <h1 className="catalogo-titulo">Catálogo de productos</h1>
            <p className="catalogo-subtitulo">{filtered.length} productos disponibles</p>
          </div>
          <input
            className="catalogo-busqueda"
            placeholder="🔍  Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="catalogo-categorias">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`cat-btn ${activeCategory === cat ? 'cat-btn-activa' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ color: 'var(--text)', padding: '40px 0' }}>Cargando productos...</p>
        ) : filtered.length === 0 ? (
          <div className="catalogo-vacio">
            <p>No se encontraron productos 😕</p>
          </div>
        ) : (
          <div className="catalogo-grid">
            {filtered.map((prod) => {
              const inCart = quantityInCart(prod.id);
              const justAdded = recentlyAdded.includes(prod.id);
              const icon = iconsByCategory[prod.category?.name ?? ''] ?? '📦';

              return (
                <div key={prod.id} className="prod-card">
                  <span className="prod-cat-badge">{prod.category?.name ?? 'Otros'}</span>
                  <div className="prod-icono">{icon}</div>
                  <h3 className="prod-nombre">{prod.name}</h3>
                  <p className="prod-precio">${Number(prod.price).toLocaleString()}</p>

                  {inCart > 0 && <p className="prod-en-carrito">✓ {inCart} en carrito</p>}

                  <button
                    className={`prod-btn-agregar ${justAdded ? 'prod-btn-ok' : ''}`}
                    onClick={() => handleAdd(prod)}
                  >
                    {justAdded ? '✓ Agregado' : '🛒 Agregar al carrito'}
                  </button>

                  <button className="prod-btn-ver" onClick={() => navigate(`/producto/${prod.id}`)}>
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
