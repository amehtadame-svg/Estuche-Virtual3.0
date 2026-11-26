import { Link } from 'react-router-dom';
import { ArrowRight, Heart, RefreshCw, ShoppingBag, Trash2 } from 'lucide-react';
import AccountNav from '../../components/layout/AccountNav';
import { useWishlist } from '../../hooks/useWishlist';
import { useCart } from '../../hooks/useCart';
import { productImage } from '../../lib/productImage';
import { formatCOP } from '../Checkout/paymentFormat';
import './Wishlist.css';

export default function Wishlist() {
  const { items, loading, error, busy, toggle, reload } = useWishlist();
  const { add } = useCart();
  return <main className="wishlist-page page-shell">
    <AccountNav />
    <header className="wishlist-heading"><div><p className="account-eyebrow">TU CUENTA</p><h1>Mis favoritos</h1><p>Guarda tus ideas para después. Tu lista es privada y no modifica el carrito.</p></div><button type="button" className="ui-btn" onClick={reload} disabled={loading || busy.length > 0}><RefreshCw size={16} /> Actualizar</button></header>
    {loading ? <p className="wishlist-message" role="status">Cargando tus favoritos…</p> : error ? <section className="wishlist-message" role="alert"><h2>No pudimos consultar tu lista</h2><p>{error}</p><button type="button" className="ui-btn ui-btn--primary" onClick={reload}>Reintentar</button></section> : items.length === 0 ? <section className="wishlist-message"><Heart size={38} /><h2>Tu lista está vacía</h2><p>Guarda productos desde el catálogo o su ficha para encontrarlos aquí.</p><Link className="ui-btn ui-btn--primary" to="/catalogo">Explorar catálogo <ArrowRight size={16} /></Link></section> : <div className="wishlist-grid">{items.map(item => {
      const product = item.product;
      const image = productImage({ ...product, images: product.images.map(image => ({ ...image, isPrimary: !!image.isPrimary })) });
      const unavailable = !!product.deletedAt;
      return <article className="wishlist-card" key={item.id}>
        {unavailable ? <div className="wishlist-image">{image ? <img src={image} alt="" /> : <span>Sin imagen</span>}</div> : <Link to={`/producto/${product.id}`} className="wishlist-image">{image ? <img src={image} alt={product.name} /> : <span>Sin imagen</span>}</Link>}
        <div className="wishlist-card-body"><p>{product.category?.name ?? 'Catálogo'}</p><h2>{unavailable ? product.name : <Link to={`/producto/${product.id}`}>{product.name}</Link>}</h2><strong>{formatCOP(product.price)}</strong><span className="wishlist-stock">{unavailable ? 'Producto no disponible' : product.stock > 0 ? `Disponible · ${product.stock} en stock` : 'Agotado por ahora'}</span>
          <div className="wishlist-actions"><button type="button" className="ui-btn ui-btn--primary" disabled={unavailable || product.stock < 1} onClick={() => void add({ id: product.id, name: product.name, price: Number(product.price), category: product.category?.name ?? 'Otros', icon: '📦', imageUrl: image })}><ShoppingBag size={16} /> Agregar al carrito</button>
          <button type="button" className="ui-btn" disabled={busy.length > 0} onClick={() => void toggle(item.productId)} aria-label={`Quitar ${product.name} de favoritos`}><Trash2 size={16} /> Quitar</button></div>
        </div>
      </article>;
    })}</div>}
  </main>;
}
