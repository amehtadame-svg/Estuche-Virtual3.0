import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import { API, authHeaders } from '../../../api/api';
import './Products.css';

interface CategoryItem {
  id: string;
  name: string;
  description?: string | null;
}

interface ProviderItem {
  id: string;
  name: string;
}

interface Product {
  id: string;
  sku?: string | null;
  barcode?: string | null;
  name: string;
  cost?: number;
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

const emptyForm = {
  name: '',
  sku: '',
  barcode: '',
  cost: '',
  price: '',
  margin: '',
  stock: '',
  stockMin: '5',
  categoryId: '',
  supplierId: '',
  description: '',
  imageUrl: '',
};

const NUMERIC_RULE_ALERT =
  'El precio de venta y el costo de adquisición deben ser valores numéricos estrictamente mayores a cero, y el stock inicial no puede contener cifras negativas';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [invalidFields, setInvalidFields] = useState<Record<string, boolean>>({});
  const [formError, setFormError] = useState('');
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
        if (Array.isArray(data)) {
          setProducts(data);
          setFiltered(data);
        }
        setLoading(false);
      })
      .catch(() => {
        showMessage('Error al cargar productos.');
        setLoading(false);
      });
  };

  const loadCatalogs = () => {
    fetch(API.categories, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});

    fetch(API.providers, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setProviders(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadProducts();
    loadCatalogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let result = products;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    }

    if (categoryFilter) {
      result = result.filter(
        (p) => p.categoryId === categoryFilter || p.category?.name === categoryFilter
      );
    }

    setFiltered(result);
  }, [search, categoryFilter, products]);

  const showMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3500);
  };

  const calculateMarginPercent = (costVal: number, priceVal: number): string => {
    if (!Number.isFinite(costVal) || !Number.isFinite(priceVal) || priceVal <= 0 || costVal <= 0) {
      return '';
    }
    return (((priceVal - costVal) / priceVal) * 100).toFixed(1);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setInvalidFields((prev) => ({ ...prev, [name]: false }));
    setFormError('');

    setForm((prev) => {
      const next = { ...prev, [name]: value };
      const costNum = Number(next.cost);
      const priceNum = Number(next.price);

      if (name === 'cost' || name === 'price') {
        next.margin = calculateMarginPercent(costNum, priceNum);
      } else if (name === 'margin') {
        const marginNum = Number(value);
        if (costNum > 0 && Number.isFinite(marginNum) && marginNum >= 0 && marginNum < 100) {
          const suggestedPrice = Math.round(costNum / (1 - marginNum / 100));
          next.price = String(suggestedPrice);
        }
      }
      return next;
    });
  };

  // CA-001.3 — Validación en tiempo real al perder el foco en nombre, SKU o código de barras
  const handleBlurDuplicateCheck = (field: 'name' | 'sku' | 'barcode') => {
    const value = form[field].trim().toLowerCase();
    if (!value) return;

    const duplicate = products.find((p) => {
      if (editingId && p.id === editingId) return false;
      if (field === 'name') return p.name.trim().toLowerCase() === value;
      if (field === 'sku') return (p.sku ?? '').trim().toLowerCase() === value;
      if (field === 'barcode') return (p.barcode ?? '').trim().toLowerCase() === value;
      return false;
    });

    if (duplicate) {
      setInvalidFields((prev) => ({ ...prev, [field]: true }));
      setFormError(
        'No se puede completar el registro: Ya existe un producto almacenado con el mismo código SKU o nombre comercial dentro del sistema'
      );
    }
  };

  const openNewModal = () => {
    setForm(emptyForm);
    setInvalidFields({});
    setFormError('');
    setEditingId(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setInvalidFields({});
    setFormError('');
    setForm(emptyForm);
  };

  const handleSave = async () => {
    const nextInvalid: Record<string, boolean> = {};
    if (!form.name.trim()) nextInvalid.name = true;
    if (!form.sku.trim()) nextInvalid.sku = true;
    if (!form.categoryId) nextInvalid.categoryId = true;

    const costNum = Number(form.cost);
    const priceNum = Number(form.price);
    const stockNum = form.stock === '' ? NaN : Number(form.stock);
    const stockMinNum = form.stockMin === '' ? 5 : Number(form.stockMin);

    // CA-001.2 — Validación estricta de reglas de negocio y restricciones numéricas
    if (!Number.isFinite(costNum) || costNum <= 0) nextInvalid.cost = true;
    if (!Number.isFinite(priceNum) || priceNum <= 0) nextInvalid.price = true;
    if (!Number.isFinite(stockNum) || stockNum < 0) nextInvalid.stock = true;
    if (!Number.isFinite(stockMinNum) || stockMinNum < 0) nextInvalid.stockMin = true;

    if (nextInvalid.cost || nextInvalid.price || nextInvalid.stock) {
      setInvalidFields(nextInvalid);
      setFormError(NUMERIC_RULE_ALERT);
      return;
    }

    if (Object.keys(nextInvalid).length > 0) {
      setInvalidFields(nextInvalid);
      setFormError('Por favor completa todos los campos obligatorios marcados con (*).');
      return;
    }

    const body = {
      name: form.name.trim(),
      sku: form.sku.trim() || null,
      barcode: form.barcode.trim() || null,
      cost: costNum,
      price: priceNum,
      stock: stockNum,
      stockMin: stockMinNum,
      categoryId: form.categoryId || null,
      supplierId: form.supplierId || null,
      description: form.description.trim() || null,
      ...(form.imageUrl.trim() ? { imageUrl: form.imageUrl.trim() } : {}),
    };

    try {
      const url = editingId !== null ? `${API.products}/${editingId}` : API.products;
      const method = editingId !== null ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        setFormError(
          errData?.message ||
            'No se puede completar el registro: Ya existe un producto almacenado con el mismo código SKU o nombre comercial dentro del sistema'
        );
        return;
      }

      loadProducts();
      closeModal();
      showMessage(
        editingId !== null
          ? 'Producto actualizado exitosamente.'
          : 'Producto registrado exitosamente en el catálogo'
      );
    } catch {
      setFormError('Error de conexión al guardar el producto.');
    }
  };

  const handleEdit = (prod: Product) => {
    const costVal = Number(prod.cost ?? 0);
    const priceVal = Number(prod.price ?? 0);
    const matchedCatId =
      prod.categoryId ??
      categories.find((c) => c.name === prod.category?.name)?.id ??
      '';

    setForm({
      name: prod.name,
      sku: prod.sku ?? '',
      barcode: prod.barcode ?? '',
      cost: costVal > 0 ? String(costVal) : '',
      price: String(priceVal),
      margin: calculateMarginPercent(costVal, priceVal),
      stock: String(prod.stock ?? 0),
      stockMin: String(prod.stockMin ?? 5),
      categoryId: matchedCatId,
      supplierId: prod.supplierId ?? '',
      description: prod.description ?? '',
      imageUrl: prod.images?.find((i) => i.isPrimary)?.url ?? prod.images?.[0]?.url ?? '',
    });
    setInvalidFields({});
    setFormError('');
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
            <h2 className="titulo-productos">Gestión de Productos</h2>
            <p className="subtitulo-usuarios">
              Administra la ficha técnica completa del catálogo de inventario (HU-001)
            </p>
          </div>
          <button className="btn-nuevo-producto" onClick={openNewModal}>
            + Nuevo producto
          </button>
        </div>

        <div className="productos-filtros">
          <input
            className="productos-busqueda"
            placeholder="🔍 Buscar por nombre, SKU o código de barras..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="productos-filtro-cat"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
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
                <th>SKU / Código</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Proveedor</th>
                <th>Costo</th>
                <th>Precio Venta</th>
                <th>Margen</th>
                <th>Stock (Mín.)</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((prod) => {
                const costVal = Number(prod.cost ?? 0);
                const priceVal = Number(prod.price ?? 0);
                const marginPct =
                  priceVal > 0 && costVal > 0
                    ? (((priceVal - costVal) / priceVal) * 100).toFixed(1)
                    : null;

                return (
                  <tr key={prod.id}>
                    <td>
                      <span className="sku-badge">{prod.sku || '—'}</span>
                      {prod.barcode && <small className="barcode-sub">{prod.barcode}</small>}
                    </td>
                    <td className="nombre-producto">
                      {prod.name}
                      {prod.description && (
                        <small className="desc-producto">{prod.description}</small>
                      )}
                    </td>
                    <td>{prod.category?.name ?? '—'}</td>
                    <td>{prod.supplier?.name ?? '—'}</td>
                    <td>{costVal > 0 ? `$${costVal.toLocaleString()}` : '—'}</td>
                    <td className="precio-producto">${priceVal.toLocaleString()}</td>
                    <td>
                      {marginPct !== null ? (
                        <span className="margen-badge">{marginPct}%</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <span
                        className={`stock-badge ${
                          prod.stock === 0
                            ? 'stock-agotado'
                            : lowStock(prod)
                            ? 'stock-bajo'
                            : 'stock-ok'
                        }`}
                      >
                        {prod.stock ?? 0} / mín. {prod.stockMin ?? 5}
                        {prod.stock === 0 ? ' ⛔ agotado' : lowStock(prod) ? ' ⚠ bajo' : ''}
                      </span>
                    </td>
                    <td>
                      <button className="btn-editar-producto" onClick={() => handleEdit(prod)}>
                        Editar
                      </button>
                      <button
                        className="btn-eliminar-producto"
                        onClick={() => handleDelete(prod.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {filtered.length === 0 && !loading && (
          <p className="productos-vacio">No se encontraron productos.</p>
        )}
      </div>

      {modalOpen && (
        <Modal
          titulo={editingId !== null ? 'Editar producto' : 'Registrar nuevo producto'}
          onClose={closeModal}
          footer={
            <>
              <button className="btn-cancelar-producto" onClick={closeModal}>
                Cancelar
              </button>
              <button className="btn-guardar-producto" onClick={handleSave}>
                Guardar Producto
              </button>
            </>
          }
        >
          {formError && (
            <div className="alerta-error-producto" role="alert">
              {formError}
            </div>
          )}

          <label
            className="label-producto"
            title="Nombre comercial único con el que se identifica el artículo en el catálogo y POS"
          >
            Nombre comercial del producto <span className="campo-obligatorio">*</span>{' '}
            <span className="tooltip-icon" title="Nombre comercial único del artículo">ⓘ</span>
          </label>
          <input
            className={`input-producto ${invalidFields.name ? 'input-invalido' : ''}`}
            name="name"
            value={form.name}
            onChange={handleChange}
            onBlur={() => handleBlurDuplicateCheck('name')}
            placeholder="Ej. Cuaderno cosido 100 hojas cuadriculado"
          />

          <div className="fila-2-col">
            <div>
              <label
                className="label-producto"
                title="Código alfanumérico interno único de referencia en inventario (SKU)"
              >
                Código SKU único <span className="campo-obligatorio">*</span>{' '}
                <span className="tooltip-icon" title="Identificador único interno (ej. EV-001)">ⓘ</span>
              </label>
              <input
                className={`input-producto ${invalidFields.sku ? 'input-invalido' : ''}`}
                name="sku"
                value={form.sku}
                onChange={handleChange}
                onBlur={() => handleBlurDuplicateCheck('sku')}
                placeholder="Ej. EV-019"
              />
            </div>

            <div>
              <label
                className="label-producto"
                title="Código de barras EAN/UPC para lector óptico en caja (POS)"
              >
                Código de barras{' '}
                <span className="tooltip-icon" title="Código EAN-13 o UPC del empaque">ⓘ</span>
              </label>
              <input
                className={`input-producto ${invalidFields.barcode ? 'input-invalido' : ''}`}
                name="barcode"
                value={form.barcode}
                onChange={handleChange}
                onBlur={() => handleBlurDuplicateCheck('barcode')}
                placeholder="Ej. 7701234567019"
              />
            </div>
          </div>

          <div className="fila-2-col">
            <div>
              <label
                className="label-producto"
                title="Categoría comercial a la que pertenece el producto"
              >
                Categoría comercial <span className="campo-obligatorio">*</span>{' '}
                <span className="tooltip-icon" title="Clasificación del producto en el catálogo">ⓘ</span>
              </label>
              <select
                className={`input-producto ${invalidFields.categoryId ? 'input-invalido' : ''}`}
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="label-producto"
                title="Proveedor principal que suministra el artículo"
              >
                Proveedor
              </label>
              <select
                className="input-producto"
                name="supplierId"
                value={form.supplierId}
                onChange={handleChange}
              >
                <option value="">Sin proveedor asignado</option>
                {providers.map((prov) => (
                  <option key={prov.id} value={prov.id}>
                    {prov.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="fila-3-col">
            <div>
              <label
                className="label-producto"
                title="Valor unitario pagado al proveedor por adquirir el producto (debe ser > 0)"
              >
                Costo adquisición <span className="campo-obligatorio">*</span>{' '}
                <span className="tooltip-icon" title="Costo de compra al proveedor (> 0)">ⓘ</span>
              </label>
              <input
                className={`input-producto ${invalidFields.cost ? 'input-invalido' : ''}`}
                type="number"
                min="1"
                name="cost"
                value={form.cost}
                onChange={handleChange}
                placeholder="Ej. 7500"
              />
            </div>

            <div>
              <label
                className="label-producto"
                title="Precio de venta al público con impuestos incluidos (debe ser > 0)"
              >
                Precio de venta <span className="campo-obligatorio">*</span>{' '}
                <span className="tooltip-icon" title="Precio final de venta al público (> 0)">ⓘ</span>
              </label>
              <input
                className={`input-producto ${invalidFields.price ? 'input-invalido' : ''}`}
                type="number"
                min="1"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="Ej. 12500"
              />
            </div>

            <div>
              <label
                className="label-producto"
                title="Porcentaje de margen comercial sobre el precio de venta: ((Precio - Costo) / Precio) * 100"
              >
                Margen (%) <span className="tooltip-icon" title="Margen de rentabilidad calculado">ⓘ</span>
              </label>
              <input
                className="input-producto"
                type="number"
                step="0.1"
                name="margin"
                value={form.margin}
                onChange={handleChange}
                placeholder="Ej. 40.0%"
              />
            </div>
          </div>

          {Number(form.price) > 0 && Number(form.cost) > 0 && (
            <p className="resumen-utilidad-producto">
              Utilidad unitaria estimada:{' '}
              <strong>
                ${(Number(form.price) - Number(form.cost)).toLocaleString()} COP
              </strong>{' '}
              ({form.margin}%)
            </p>
          )}

          <div className="fila-2-col">
            <div>
              <label
                className="label-producto"
                title="Unidades físicas recibidas inicialmente en bodega (no puede ser negativo)"
              >
                Stock inicial en bodega <span className="campo-obligatorio">*</span>{' '}
                <span className="tooltip-icon" title="Existencias disponibles (>= 0)">ⓘ</span>
              </label>
              <input
                className={`input-producto ${invalidFields.stock ? 'input-invalido' : ''}`}
                type="number"
                min="0"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                placeholder="Cantidad inicial (>= 0)"
              />
            </div>

            <div>
              <label
                className="label-producto"
                title="Umbral mínimo de unidades antes de disparar alerta de reposición (punto de reorden)"
              >
                Punto de reorden (Stock mín.) <span className="campo-obligatorio">*</span>{' '}
                <span className="tooltip-icon" title="Umbral para alerta de bajo stock">ⓘ</span>
              </label>
              <input
                className={`input-producto ${invalidFields.stockMin ? 'input-invalido' : ''}`}
                type="number"
                min="0"
                name="stockMin"
                value={form.stockMin}
                onChange={handleChange}
                placeholder="Ej. 5"
              />
            </div>
          </div>

          <label className="label-producto">Descripción técnica</label>
          <textarea
            className="input-producto"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Características del producto, marca, presentación..."
            rows={2}
          />

          <label className="label-producto">URL de la imagen</label>
          <input
            className="input-producto"
            name="imageUrl"
            value={form.imageUrl}
            onChange={handleChange}
            placeholder="https://i.postimg.cc/..."
          />
          {form.imageUrl && (
            <img
              src={form.imageUrl}
              alt="Vista previa"
              style={{ width: 72, height: 72, objectFit: 'contain', margin: '4px 0 8px' }}
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          )}
        </Modal>
      )}
    </>
  );
}