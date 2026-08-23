import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { API } from '../../api/api';
import './Product.css';

const iconsByCategory: Record<string, string> = {
  Cuadernos: '📓',
  Colores: '🎨',
  Carpetas: '📁',
  Lapiceros: '🖊️',
  Mochilas: '🎒',
  Tijeras: '✂️',
  Otros: '📦',
};

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  stock: number;
  category: { name: string } | null;
}

export default function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add, items } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(API.products)
      .then((r) => r.json())
      .then((data: Product[]) => {
        const found = data.find((p) => p.id === id) ?? null;
        setProduct(found);
        if (found) {
          setRelated(
            data
              .filter((p) => (p.category?.name ?? 'Otros') === (found.category?.name ?? 'Otros') && p.id !== found.id)
              .slice(0, 4)
          );
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="prod-detalle-vacio">
        <p>Cargando producto...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="prod-detalle-vacio">
        <p>Producto no encontrado.</p>
        <button onClick={() => navigate('/catalogo')}>Volver al catálogo</button>
      </div>
    );
  }

  const inCart = items.find((i) => i.id === product.id)?.quantity ?? 0;
  const icon = iconsByCategory[product.category?.name ?? ''] ?? '📦';

  const handleAdd = () => {
    add({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      category: product.category?.name ?? 'Otros',
      icon,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="prod-detalle-container">
      <div className="prod-detalle-card">
        <div className="prod-detalle-icono-wrap">
          <span className="prod-detalle-icono">{icon}</span>
        </div>

        <div className="prod-detalle-info">
          <span className="prod-detalle-cat">{product.category?.name ?? 'Otros'}</span>
          <h1 className="prod-detalle-nombre">{product.name}</h1>
          <p className="prod-detalle-desc">{product.description}</p>

          <div className="prod-detalle-meta">
            <div className="prod-detalle-meta-item">
              <span className="meta-label">Disponibilidad</span>
              <span className={`meta-valor ${product.stock > 0 ? 'stock-ok' : 'stock-no'}`}>
                {product.stock > 0 ? `✓ En stock (${product.stock} uds)` : '✗ Sin stock'}
              </span>
            </div>
          </div>

          <p className="prod-detalle-precio">${Number(product.price).toLocaleString()}</p>

          {inCart > 0 && <p className="prod-detalle-en-carrito">✓ {inCart} en tu carrito</p>}

          {/* Selector de cantidad */}
          <div className="prod-cantidad-wrap">
            <span className="prod-cantidad-label">Cantidad</span>
            <div className="prod-cantidad-control">
              <button className="prod-cantidad-btn" onClick={() => setQuantity((c) => Math.max(1, c - 1))} disabled={quantity <= 1}>
                −
              </button>
              <span className="prod-cantidad-num">{quantity}</span>
              <button
                className="prod-cantidad-btn"
                onClick={() => setQuantity((c) => Math.min(product.stock, c + 1))}
                disabled={quantity >= product.stock}
              >
                +
              </button>
            </div>
            <span className="prod-cantidad-subtotal">
              Subtotal: <strong>${(Number(product.price) * quantity).toLocaleString()}</strong>
            </span>
          </div>

          <div className="prod-detalle-acciones">
            <button
              className={`prod-detalle-btn-agregar ${added ? 'agregado' : ''}`}
              onClick={handleAdd}
              disabled={product.stock === 0}
            >
              {added ? '✓ Agregado' : '🛒 Agregar al carrito'}
            </button>
            <button className="prod-detalle-btn-carrito" onClick={() => navigate('/carrito')}>
              Ver carrito
            </button>
          </div>
        </div>
      </div>

      {/* Productos relacionados */}
      {related.length > 0 && (
        <div className="prod-relacionados">
          <h2 className="prod-relacionados-titulo">Productos relacionados</h2>
          <div className="prod-relacionados-grid">
            {related.map((p) => (
              <Link key={p.id} to={`/producto/${p.id}`} className="prod-rel-card">
                <span className="prod-rel-icono">{iconsByCategory[p.category?.name ?? ''] ?? '📦'}</span>
                <p className="prod-rel-nombre">{p.name}</p>
                <p className="prod-rel-precio">${Number(p.price).toLocaleString()}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}