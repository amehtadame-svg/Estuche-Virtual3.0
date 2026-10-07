import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import { API, authHeaders } from '../../../api/api';
import './Products.css';

interface Category {
  id: string;
  name: string;
}

interface Provider {
  id: string;
  name: string;
}

const emptyForm = {
  name: '',
  price: '',
  stock: '',
  stockMin: '',
  categoryId: '',
  supplierId: '',
  description: '',
  imageUrl: '',
};

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  stock: number;
  stockMin: number;
  categoryId: string | null;
  supplierId: string | null;
  category: { id?: string; name: string } | null;
  supplier: { id?: string; name: string } | null;
  images?: { url: string; isPrimary?: boolean }[];
}

/** Convierte la respuesta del backend en un mensaje legible para el usuario. */
const readError = async (res: Response, fallback: string) => {
  try {
    const data = await res.json();
    return data?.message ?? fallback;
  } catch {
    return fallback;
  }
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const loadProducts = async () => {
    try {
      const res = await fetch(API.products, { headers: authHeaders() });
      if (!res.ok) throw new Error(await readError(res, 'Error al cargar productos.'));
      const data = await res.json();
      setProducts(data);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar productos.');
    } finally {
      setLoading(false);
    }
  };

  // Las categorías y proveedores salen de la BD: antes eran listas fijas en el
  // código que no coincidían con los datos reales y hacían que el formulario
  // guardara una categoría inexistente (o ninguna).
  const loadCatalogs = async () => {
    try {
      const [resCat, resProv] = await Promise.all([
        fetch(API.categories, { headers: authHeaders() }),
        fetch(API.providers, { headers: authHeaders() }),
      ]);
      if (resCat.ok) setCategories(await resCat.json());
      if (resProv.ok) setProviders(await resProv.json());
    } catch {
      /* el formulario sigue funcionando sin catálogos */
    }
  };

  useEffect(() => {
    loadProducts();
    loadCatalogs();
  }, []);

  useEffect(() => {
    let result = products;

    if (search) {
      result = result.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    }

    if (categoryFilter) {
      result = result.filter((p) => p.category?.name === categoryFilter);
    }

    setFiltered(result);
  }, [search, categoryFilter, products]);

  const showMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 2500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openNewModal = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || form.stock === '') {
      showMessage('Por favor completa todos los campos.');
      return;
    }

    setSaving(true);
    setError('');

    // Se envía la categoría y el proveedor por su id real (UUID). Si el
    // backend no los recibe, ahora los conserva en lugar de borrarlos.
    const body = {
      name: form.name,
      price: Number(form.price),
      stock: Number(form.stock),
      stockMin: Number(form.stockMin) || 5,
      description: form.description,
      ...(form.categoryId ? { categoryId: form.categoryId } : { categoryId: null }),
      ...(form.supplierId ? { supplierId: form.supplierId } : { supplierId: null }),
      ...(form.imageUrl ? { imageUrl: form.imageUrl } : {}),
    };

    try {
      const url = editingId !== null ? `${API.products}/${editingId}` : API.products;
      const method = editingId !== null ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });

      if (!res.ok) {
        setError(await readError(res, 'No se pudo guardar el producto.'));
        return;
      }

      showMessage(editingId !== null ? 'Producto actualizado.' : 'Producto agregado.');
      await loadProducts();
      closeModal();
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (prod: Product) => {
    setForm({
      name: prod.name,
      price: String(prod.price),
      stock: String(prod.stock ?? 0),
      stockMin: String(prod.stockMin ?? 5),
      categoryId: prod.category?.id ?? prod.categoryId ?? '',
      supplierId: prod.supplierId ?? '',
      description: prod.description ?? '',
      imageUrl: prod.images?.find((i) => i.isPrimary)?.url ?? prod.images?.[0]?.url ?? '',
    });
    setEditingId(prod.id);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    setError('');
    try {
      const res = await fetch(`${API.products}/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) {
        setError(await readError(res, 'No se pudo eliminar el producto.'));
        return;
      }
      showMessage('Producto eliminado.');
      await loadProducts();
    } catch {
      setError('No se pudo conectar con el servidor.');
    }
  };

  /**
   * Ajuste rápido de inventario (+ / −).
   * Guarda el movimiento en la BD en el mismo instante: el stock y el kardex
   * nunca quedan desincronizados.
   */
  const adjustStock = async (id: string, delta: number) => {
    setError('');
    try {
      const res = await fetch(`${API.products}/${id}/stock`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          delta,
          reason: delta > 0 ? 'Entrada de mercancía' : 'Salida de mercancía',
        }),
      });
      if (!res.ok) {
        setError(await readError(res, 'No se pudo ajustar el stock.'));
        return;
      }
      showMessage(`Stock ${delta > 0 ? 'aumentado' : 'disminuido'} en ${Math.abs(delta)}.`);
      await loadProducts();
    } catch {
      setError('No se pudo conectar con el servidor.');
    }
  };

  const lowStock = (prod: Product) => prod.stock <= prod.stockMin;

  return (
    <>
      <div className="productos-page">
        <div className="productos-topbar">
          <div>
            <h2 className="titulo-productos">Gestion de Productos</h2>
            <p className="subtitulo-usuarios">Administra los Productos registrados</p>
          </div>
          <button className="btn-nuevo-producto" onClick={openNewModal}>
            + Nuevo producto
          </button>
        </div>

        <div className="productos-filtros">
          <input
            className="productos-busqueda"
            placeholder="🔍 Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="productos-filtro-cat" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {message && <div className="mensaje-productos">{message}</div>}
        {error && <div className="mensaje-productos mensaje-productos-error">{error}</div>}

        {loading ? (
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
              {filtered.map((prod) => (
                <tr key={prod.id}>
                  <td className="nombre-producto">{prod.name}</td>
                  <td className="desc-producto">{prod.description ?? '—'}</td>
                  <td>{prod.category?.name ?? '—'}</td>
                  <td>{prod.supplier?.name ?? '—'}</td>
                  <td className="precio-producto">${Number(prod.price).toLocaleString()}</td>
                  <td>
                    <span className={`stock-badge ${lowStock(prod) ? 'stock-bajo' : 'stock-ok'}`}>
                      {prod.stock ?? 0}
                      {lowStock(prod) && ' ⚠ bajo'}
                    </span>
                    <span className="stock-ajuste">
                      <button type="button" title="Quitar una unidad" onClick={() => adjustStock(prod.id, -1)}>−</button>
                      <button type="button" title="Agregar una unidad" onClick={() => adjustStock(prod.id, 1)}>+</button>
                    </span>
                  </td>
                  <td>
                    <button className="btn-editar-producto" onClick={() => handleEdit(prod)}>
                      Editar
                    </button>
                    <button className="btn-eliminar-producto" onClick={() => handleDelete(prod.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {filtered.length === 0 && !loading && <p className="productos-vacio">No se encontraron productos.</p>}
      </div>

      {modalOpen && (
        <Modal
          titulo={editingId !== null ? 'Editar producto' : 'Nuevo producto'}
          onClose={closeModal}
          footer={
            <>
              <button className="btn-cancelar-producto" onClick={closeModal}>
                Cancelar
              </button>
              <button className="btn-guardar-producto" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : editingId !== null ? 'Guardar cambios' : 'Agregar producto'}
              </button>
            </>
          }
        >
          <label className="label-producto">Nombre</label>
          <input className="input-producto" name="name" value={form.name} onChange={handleChange} placeholder="Nombre del producto" />

          <label className="label-producto">Descripción</label>
          <textarea className="input-producto" name="description" value={form.description} onChange={handleChange} placeholder="Descripción del producto" rows={3} />

          <label className="label-producto">URL de la imagen</label>
          <input className="input-producto" name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="https://i.postimg.cc/..." />
          {form.imageUrl && (
            <img
              src={form.imageUrl}
              alt="Vista previa"
              style={{ width: 80, height: 80, objectFit: 'contain', margin: '4px 0 8px' }}
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          )}

          <label className="label-producto">Precio</label>
          <input className="input-producto" type="number" name="price" value={form.price} onChange={handleChange} placeholder="Precio en pesos" />

          <label className="label-producto">Stock actual</label>
          <input className="input-producto" type="number" name="stock" value={form.stock} onChange={handleChange} placeholder="Cantidad disponible" />

          <label className="label-producto">Stock mínimo</label>
          <input className="input-producto" type="number" name="stockMin" value={form.stockMin} onChange={handleChange} placeholder="Cantidad mínima antes de reabastecer" />

          <label className="label-producto">Categoría</label>
          <select className="input-producto" name="categoryId" value={form.categoryId} onChange={handleChange}>
            <option value="">Sin categoría</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <label className="label-producto">Proveedor</label>
          <select className="input-producto" name="supplierId" value={form.supplierId} onChange={handleChange}>
            <option value="">Sin proveedor</option>
            {providers.map((prov) => (
              <option key={prov.id} value={prov.id}>
                {prov.name}
              </option>
            ))}
          </select>
        </Modal>
      )}
    </>
  );
}
