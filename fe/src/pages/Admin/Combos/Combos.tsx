import { useEffect, useState } from 'react';
import Modal from '../../../components/ui/Modal';
import { API, authHeaders } from '../../../api/api';
import '../Products/Products.css';
import './Combos.css';

interface ProductOption {
  id: string;
  name: string;
  sku?: string | null;
  price: number | string;
  stock: number;
}

interface ComboItem {
  id: string;
  quantity: number;
  product: { id: string; name: string; sku?: string | null; stock: number };
}

interface Combo {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price: number | string;
  isActive: boolean;
  availableStock: number;
  items: ComboItem[];
}

interface ItemRow {
  productId: string;
  quantity: string;
}

const emptyRow = (): ItemRow => ({ productId: '', quantity: '1' });

// Mensajes de la HU-012 (CA-012.2 y CA-012.3)
const MIN_ITEMS_ALERT =
  'Un combo o paquete promocional debe estar integrado por al menos dos productos del catálogo';
const PRICE_ALERT = 'El precio total del combo debe ser un monto numérico positivo mayor a cero';

export default function Combos() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [rows, setRows] = useState<ItemRow[]>([emptyRow(), emptyRow()]);

  const showMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3500);
  };

  const loadCombos = () => {
    fetch(API.combos, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCombos(data);
        else showMessage(data?.message ?? 'No se pudieron cargar los combos.');
        setLoading(false);
      })
      .catch(() => {
        showMessage('Error al cargar combos.');
        setLoading(false);
      });
  };

  const loadProducts = () => {
    fetch(API.products)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadCombos();
    loadProducts();
  }, []);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setRows([emptyRow(), emptyRow()]);
    setFormError('');
    setEditingId(null);
    setIsActive(true);
  };

  const openModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const updateRow = (index: number, patch: Partial<ItemRow>) => {
    setFormError('');
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (index: number) => setRows((prev) => prev.filter((_, i) => i !== index));

  // Suma de lo que costarían los productos comprados por separado
  const regularPrice = rows.reduce((sum, row) => {
    const product = products.find((p) => p.id === row.productId);
    const qty = Number(row.quantity);
    if (!product || !Number.isFinite(qty) || qty < 1) return sum;
    return sum + Number(product.price) * qty;
  }, 0);

  const handleSave = async () => {
    const items = rows
      .filter((row) => row.productId)
      .map((row) => ({ productId: row.productId, quantity: Number(row.quantity) }));
    const priceNum = Number(price);

    if (!name.trim()) return setFormError('El nombre del combo es obligatorio.');
    if (new Set(items.map((i) => i.productId)).size < 2) return setFormError(MIN_ITEMS_ALERT);
    if (items.some((i) => !Number.isInteger(i.quantity) || i.quantity < 1))
      return setFormError('La cantidad de cada producto debe ser un número entero mayor o igual a 1.');
    if (!Number.isFinite(priceNum) || priceNum <= 0) return setFormError(PRICE_ALERT);

    setSaving(true);
    try {
      const res = await fetch(editingId ? `${API.combos}/${editingId}` : API.combos, {
        method: editingId ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          price: priceNum,
          items,
          ...(editingId ? { isActive } : {}),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        setFormError(errData?.errors?.[0]?.message ?? errData?.message ?? 'No se pudo guardar el combo.');
        return;
      }

      const saved = await res.json();
      const wasEditing = editingId !== null;
      loadCombos();
      closeModal();
      showMessage(
        wasEditing ? 'Combo actualizado exitosamente.' : `Combo creado con el código ${saved.sku}.`
      );
    } catch {
      setFormError('Error de conexión al guardar el combo.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (combo: Combo) => {
    setName(combo.name);
    setDescription(combo.description ?? '');
    setPrice(String(Number(combo.price)));
    setIsActive(combo.isActive);
    setRows(combo.items.map((i) => ({ productId: i.product.id, quantity: String(i.quantity) })));
    setFormError('');
    setEditingId(combo.id);
    setModalOpen(true);
  };

  const handleDelete = async (combo: Combo) => {
    if (!window.confirm(`¿Eliminar el combo "${combo.name}"? Dejará de estar disponible.`)) return;
    try {
      const res = await fetch(`${API.combos}/${combo.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        showMessage(errData?.message ?? 'No se pudo eliminar el combo.');
        return;
      }
      setCombos((prev) => prev.filter((c) => c.id !== combo.id));
      showMessage('Combo eliminado.');
    } catch {
      showMessage('Error de conexión al eliminar el combo.');
    }
  };

  return (
    <>
      <div className="productos-page">
        <div className="productos-topbar">
          <div>
            <h2 className="titulo-productos">Combos escolares</h2>
            <p className="subtitulo-usuarios">
              Agrupa productos del catálogo en un paquete con precio especial (HU-012)
            </p>
          </div>
          <button className="btn-nuevo-producto" onClick={openModal}>
            + Nuevo combo
          </button>
        </div>

        {message && <div className="mensaje-productos">{message}</div>}

        {loading ? (
          <p style={{ color: 'var(--text)', padding: '20px 0' }}>Cargando combos...</p>
        ) : (
          <table className="tabla-productos">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Combo</th>
                <th>Precio</th>
                <th>Disponibles</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {combos.map((combo) => (
                <tr key={combo.id}>
                  <td>
                    <span className="sku-badge">{combo.sku}</span>
                  </td>
                  <td className="nombre-producto">
                    {combo.name}
                    <small className="desc-producto">
                      {combo.items.map((i) => `${i.quantity} × ${i.product.name}`).join(' · ')}
                    </small>
                  </td>
                  <td className="precio-producto">${Number(combo.price).toLocaleString()}</td>
                  <td>
                    <span className={`stock-badge ${combo.availableStock > 0 ? 'stock-ok' : 'stock-agotado'}`}>
                      {combo.availableStock} {combo.availableStock === 1 ? 'combo' : 'combos'}
                    </span>
                  </td>
                  <td>{combo.isActive ? 'Activo' : 'Inactivo'}</td>
                  <td>
                    <button className="btn-editar-producto" onClick={() => handleEdit(combo)}>
                      Editar
                    </button>
                    <button className="btn-eliminar-producto" onClick={() => handleDelete(combo)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {combos.length === 0 && !loading && (
          <p className="productos-vacio">Aún no hay combos creados.</p>
        )}
      </div>

      {modalOpen && (
        <Modal
          titulo={editingId ? 'Editar combo escolar' : 'Crear combo escolar'}
          onClose={closeModal}
          footer={
            <>
              <button className="btn-cancelar-producto" onClick={closeModal}>
                Cancelar
              </button>
              <button className="btn-guardar-producto" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Guardar combo'}
              </button>
            </>
          }
        >
          {formError && (
            <div className="alerta-error-producto" role="alert">
              {formError}
            </div>
          )}

          <label className="label-producto">
            Nombre del combo <span className="campo-obligatorio">*</span>
          </label>
          <input
            className="input-producto"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setFormError('');
            }}
            placeholder="Ej. Combo Primaria Básico"
          />

          <label className="label-producto">Descripción</label>
          <textarea
            className="input-producto"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Qué incluye, para qué grado, temporada..."
          />

          <label className="label-producto">
            Productos del combo (mínimo 2) <span className="campo-obligatorio">*</span>
          </label>
          {rows.map((row, index) => (
            <div className="combo-item-row" key={index}>
              <select
                className="input-producto"
                value={row.productId}
                onChange={(e) => updateRow(index, { productId: e.target.value })}
              >
                <option value="">Selecciona un producto</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ${Number(p.price).toLocaleString()} (stock {p.stock})
                  </option>
                ))}
              </select>
              <input
                className="input-producto"
                type="number"
                min="1"
                value={row.quantity}
                onChange={(e) => updateRow(index, { quantity: e.target.value })}
                aria-label="Cantidad"
              />
              <button
                type="button"
                className="btn-quitar-item"
                onClick={() => removeRow(index)}
                disabled={rows.length <= 1}
                title="Quitar producto"
              >
                ✕
              </button>
            </div>
          ))}
          <button type="button" className="btn-agregar-item" onClick={addRow}>
            + Agregar otro producto
          </button>

          <label className="label-producto">
            Precio total del combo <span className="campo-obligatorio">*</span>
          </label>
          <input
            className="input-producto"
            type="number"
            min="1"
            value={price}
            onChange={(e) => {
              setPrice(e.target.value);
              setFormError('');
            }}
            placeholder="Ej. 45000"
          />
          {regularPrice > 0 && (
            <p className="combo-ahorro">
              Comprados por separado costarían <strong>${regularPrice.toLocaleString()}</strong>
              {Number(price) > 0 && (
                <>
                  {' '}
                  — {Number(price) < regularPrice ? 'el cliente ahorra ' : 'diferencia: '}
                  <strong>${Math.abs(regularPrice - Number(price)).toLocaleString()}</strong>
                </>
              )}
            </p>
          )}
          {editingId && (
            <label className="combo-activo">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />{' '}
              Combo activo (disponible para la venta)
            </label>
          )}
        </Modal>
      )}
    </>
  );
}