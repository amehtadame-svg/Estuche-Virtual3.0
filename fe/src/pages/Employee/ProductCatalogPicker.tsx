import { useEffect, useMemo, useState } from 'react';
import Modal from '../../components/ui/Modal';
import { API } from '../../api/api';
import { productImage } from '../../lib/productImage';
import { money } from './employeeApi';
import type { Product } from './employeeApi';

export default function ProductCatalogPicker({ onSelect, forOrder = false }: { onSelect: (product: Product) => void; forOrder?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true); setError('');
    fetch(API.products, { signal: controller.signal })
      .then(res => { if (!res.ok) throw new Error('No se pudo cargar el catálogo.'); return res.json(); })
      .then(data => { if (!Array.isArray(data)) throw new Error('El catálogo no está disponible.'); setProducts(data); })
      .catch(err => { if (!controller.signal.aborted) setError(err.message || 'No se pudo cargar el catálogo.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [open]);
  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase('es');
    return products.filter(product => product.name.toLocaleLowerCase('es').includes(search));
  }, [products, query]);
  return <div className="emp-catalog-picker">
    <button type="button" onClick={() => { setQuery(''); setOpen(true); }}>Buscar producto en catálogo</button>
    {open && <Modal titulo="Seleccionar producto del catálogo" onClose={() => setOpen(false)}>
      <label>Buscar por nombre<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Ej. cuaderno" /></label>
      {loading && <p role="status">Cargando catálogo…</p>}
      {error && <p role="alert" className="emp-error">{error}</p>}
      {!loading && !error && !filtered.length && <p>No se encontraron productos.</p>}
      <div className="emp-catalog-grid">{filtered.map(product => {
        const image = productImage(product);
        return <article key={product.id} className="emp-catalog-card">
          <div className="emp-catalog-image"><span>Sin foto</span>{image && <img src={image} alt={product.name} onError={e => { e.currentTarget.style.display = 'none'; }} />}</div>
          <strong>{product.name}</strong><span>{money(product.price)}</span><small>Disponibles: {product.stock}</small>
          <button type="button" disabled={forOrder && product.stock <= 0} onClick={() => { onSelect(product); setOpen(false); }}>{forOrder && product.stock <= 0 ? 'Sin existencias' : 'Seleccionar'}</button>
        </article>;
      })}</div>
    </Modal>}
  </div>;
}
