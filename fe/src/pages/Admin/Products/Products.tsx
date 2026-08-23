import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import { API, authHeaders } from '../../../api/api';
import './Products.css';

const categories = ['Cuadernos', 'Colores', 'Carpetas', 'Lapiceros', 'Mochilas', 'Tijeras'];
const emptyForm = { name: '', price: '', stock: '', stockMin: '', category: '', description: '' };

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  stock: number;
  stockMin: number;
  categoryId: string | null;
  supplierId: string | null;
  category: { name: string } | null;
  supplier: { name: string } | null;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const loadProducts = () => {
    fetch(API.products, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        setProducts(data);
        setFiltered(data);
        setLoading(false);
      })
      .catch(() => {
        showMessage('Error al cargar productos.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (!form.name || !form.price || !form.stock) {
      showMessage('Por favor completa todos los campos.');
      return;
    }

    // Nota: la categoría del formulario es solo orientativa; no se envía porque
    // el backend espera un categoryId (UUID) y aquí solo hay el nombre.
    const body = {
      name: form.name,
      price: Number(form.price),
      stock: Number(form.stock),
      stockMin: Number(form.stockMin) || 5,
      description: form.description,
    };

    if (editingId !== null) {
      await fetch(`${API.products}/${editingId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      showMessage('Producto actualizado.');
    } else {
      await fetch(API.products, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      showMessage('Producto agregado.');
    }

    loadProducts();
    closeModal();
  };

  const handleEdit = (prod: Product) => {
    setForm({
      name: prod.name,
      price: String(prod.price),
      stock: String(prod.stock ?? 0),
      stockMin: String(prod.stockMin ?? 5),
      category: prod.category?.name ?? '',
      description: prod.description ?? '',
    });
    setEditingId(prod.id);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await fetch(`${API.products}/${id}`, { method: 'DELETE', headers: authHeaders() });
    setProducts(products.filter((p) => p.id !== id));
    showMessage('Producto eliminado.');
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
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {message && <div className="mensaje-productos">{message}</div>}

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
              <button className="btn-guardar-producto" onClick={handleSave}>
                {editingId !== null ? 'Guardar cambios' : 'Agregar producto'}
              </button>
            </>
          }
        >
          <label className="label-producto">Nombre</label>
          <input className="input-producto" name="name" value={form.name} onChange={handleChange} placeholder="Nombre del producto" />

          <label className="label-producto">Descripción</label>
          <textarea className="input-producto" name="description" value={form.description} onChange={handleChange} placeholder="Descripción del producto" rows={3} />

          <label className="label-producto">Precio</label>
          <input className="input-producto" type="number" name="price" value={form.price} onChange={handleChange} placeholder="Precio en pesos" />

          <label className="label-producto">Stock actual</label>
          <input className="input-producto" type="number" name="stock" value={form.stock} onChange={handleChange} placeholder="Cantidad disponible" />

          <label className="label-producto">Stock mínimo</label>
          <input className="input-producto" type="number" name="stockMin" value={form.stockMin} onChange={handleChange} placeholder="Cantidad mínima antes de reabastecer" />

          <label className="label-producto">Categoría</label>
          <select className="input-producto" name="category" value={form.category} onChange={handleChange}>
            <option value="">Selecciona una categoría</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </Modal>
      )}
    </>
  );
}