import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { API } from '../../api/api';
import './Catalog.css';

const productImagesByName: Record<string, string> = {
  // Cuadernos 
  'Cuaderno cosido 100 hojas cuadriculado': 'https://i.postimg.cc/G2MxjsGC/cuaderno-cosido-100-hojas-cuadriculado.webp',
  'Cuaderno argollado 80 hojas rayado': 'https://i.postimg.cc/6Q5QsHy3/cuaderno-argollado-80-hojas-rayado.webp',
  'Cuaderno de dibujo 30 hojas': 'https://i.postimg.cc/BQ049hVR/cuaderno-de-dibujo-3o-hojas.webp',

  // Escritura
  'Lápiz negro HB No. 2': 'https://i.postimg.cc/nhSyzT3L/lapiz-HB-No-27.webp',
  'Lapicero azul punta fina': 'https://i.postimg.cc/fRyP6mMS/lapicero-azul-punta-fina.webp',
  'Corrector líquido 7 ml': 'https://i.postimg.cc/Qt30xTZQ/corector-liquido-7-ml.webp',
  'Marcadores punta fina x12': 'https://i.postimg.cc/G2Dtz44F/marcadores-punta-fina-x12.webp',

  // Arte y Papelería
  'Colores largos x12': 'https://i.postimg.cc/fRkwBVFk/colores-por-12.webp',
  'Temperas escolares x6': 'https://i.postimg.cc/GpGn5GjR/temperas-escolares-x6.webp',
  'Resma papel carta x500 hojas': 'https://i.postimg.cc/N0wzLV1c/resma-papel-carta-x500-hojas.webp',
  'Cartulina plana tamaño pliego': 'https://i.postimg.cc/85YdfJqt/pliego-de-carulina.webp',
  'Pegante líquido escolar 125 g': 'https://i.postimg.cc/vTQ1BQmP/pegamento-escolar.webp',
  'Tijeras escolares punta roma': 'https://i.postimg.cc/Wby3Rm0G/tijeras-punta-roma.webp',

  // Oficina
  'Grapadora metálica pequeña': 'https://i.postimg.cc/zGBqfyFq/grapadora-pequena.jpg',
  'Notas adhesivas 76 x 76 mm': 'https://i.postimg.cc/7ZPpNj5c/notas-adhesivas.webp',

  // Mochilas
  'Morral escolar básico azul': 'https://i.postimg.cc/2S5KWvJk/morral-escolar-basico-azul.webp',
  'Cartuchera doble compartimento': 'https://i.postimg.cc/D02gT3kY/cartuchera-dos-compartimentos.webp',

  // Tecnología
  'Memoria USB 32 GB': 'https://i.postimg.cc/50pz8HT5/memoria-usb-32-GB.webp',
  'Calculadora científica básica': 'https://i.postimg.cc/HLYsXSgh/calculadora-cientifica-basica.webp',
};

const iconsByCategory: Record<string, string> = {
  Cuadernos: '📓',
  Escritura: '✏️',
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
  images?: { url: string; isPrimary?: boolean }[];
}

const getImageUrl = (p: Product) => p.images?.find((i) => i.isPrimary)?.url ?? p.images?.[0]?.url ?? null;

export default function Catalog() {
  const { add, items } = useCart();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [search, setSearch] = useState('');
  const [recentlyAdded, setRecentlyAdded] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(API.products)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('Respuesta inválida del servidor');
        setProducts(data);
      })
      .catch((e) => setError(e.message ?? 'Error al cargar productos'))
      .finally(() => setLoading(false));
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
        ) : error ? (
          <div className="catalogo-vacio">
            <p>No se pudieron cargar los productos 😕</p>
            <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>{error}</p>
            <button className="cat-btn cat-btn-activa" onClick={() => window.location.reload()}>
              Reintentar
            </button>
          </div>
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

              const imageUrl = getImageUrl(prod) ?? productImagesByName[prod.name] ?? null;

              return (
                <div key={prod.id} className="prod-card">
                  <span className="prod-cat-badge">{prod.category?.name ?? 'Otros'}</span>
                  {imageUrl ? (
                    <img className="prod-imagen" src={imageUrl} alt={prod.name} loading="lazy" />
                  ) : (
                    <div className="prod-icono">{icon}</div>
                  )}
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