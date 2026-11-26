import { useEffect, useState } from 'react';
import Modal from '../../../components/ui/Modal';
import { API, authHeaders } from '../../../api/api';
import { runDeleteAction } from '../../../lib/deleteAction';
import { notify } from '../../../lib/notifications';
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
  product: {
    id: string;
    name: string;
    sku?: string | null;
    price: number | string;
    stock: number;
  };
}

interface Combo {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price: number | string;
  regularPrice?: number;
  discountAmount?: number;
  discountPercent?: number;
  isActive: boolean;
  availableStock: number;
  items: ComboItem[];
}

interface ItemRow {
  productId: string;
  quantity: string;
}

type PricingSource = 'percent' | 'amount' | 'price';

const emptyRow = (): ItemRow => ({ productId: '', quantity: '1' });

const PRESET_DISCOUNTS = [5, 10, 15, 20, 25];

const MIN_ITEMS_ALERT =
  'Un combo o paquete promocional debe estar integrado por al menos dos productos del catálogo';
const PRICE_ALERT = 'El precio total del combo debe ser un monto numérico positivo mayor a cero';
const DISCOUNT_ALERT =
  'El descuento establecido no puede ser negativo ni igualar o superar el valor total de los productos';

const formatPercent = (pct: number): string => {
  if (!Number.isFinite(pct) || pct <= 0) return '0';
  const rounded = Number(pct.toFixed(1));
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
};

const computeRegularFromRows = (targetRows: ItemRow[], catalog: ProductOption[]): number =>
  targetRows.reduce((sum, row) => {
    const product = catalog.find((p) => p.id === row.productId);
    const qty = Number(row.quantity);
    if (!product || !Number.isFinite(qty) || qty < 1) return sum;
    return sum + Number(product.price) * qty;
  }, 0);

const computeComboMetrics = (combo: Combo) => {
  const regularPrice =
    combo.regularPrice !== undefined
      ? Number(combo.regularPrice)
      : combo.items.reduce((sum, item) => sum + Number(item.product.price ?? 0) * item.quantity, 0);
  const comboPrice = Number(combo.price);
  const discountAmount =
    combo.discountAmount !== undefined
      ? Number(combo.discountAmount)
      : Math.max(0, regularPrice - comboPrice);
  const discountPercent =
    combo.discountPercent !== undefined
      ? Number(combo.discountPercent)
      : regularPrice > 0 && discountAmount > 0
        ? Number(((discountAmount / regularPrice) * 100).toFixed(1))
        : 0;

  return { regularPrice, comboPrice, discountAmount, discountPercent };
};

export default function Combos() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rows, setRows] = useState<ItemRow[]>([emptyRow(), emptyRow()]);

  const [discountPercent, setDiscountPercent] = useState('10');
  const [discountAmount, setDiscountAmount] = useState('');
  const [price, setPrice] = useState('');
  const [pricingSource, setPricingSource] = useState<PricingSource>('percent');

  const loadCombos = async () => {
    try {
      const response = await fetch(API.combos, { headers: authHeaders() });
      const data = await response.json().catch(() => null);
      if (!response.ok || !Array.isArray(data)) {
        notify.error(data?.message ?? 'No se pudieron cargar los combos.');
        return;
      }
      setCombos(data);
    } catch {
      notify.error('Error al cargar los combos.');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await fetch(API.products);
      const data = await response.json().catch(() => null);
      if (Array.isArray(data)) setProducts(data);
    } catch {
      notify.error('No se pudieron cargar los productos del catálogo.');
    }
  };

  useEffect(() => {
    loadCombos();
    loadProducts();
  }, []);

  const regularPrice = computeRegularFromRows(rows, products);

  const recalculateFromRows = (
    nextRows: ItemRow[],
    catalog: ProductOption[],
    source: PricingSource = pricingSource,
    pctStr: string = discountPercent,
    amtStr: string = discountAmount,
    priceStr: string = price
  ) => {
    const nextRegular = computeRegularFromRows(nextRows, catalog);

    if (nextRegular <= 0) {
      if (source !== 'amount') setDiscountAmount('');
      if (source !== 'price') setPrice('');
      return;
    }

    if (source === 'percent') {
      const pct = pctStr.trim() === '' ? 0 : Number(pctStr);
      if (Number.isFinite(pct) && pct >= 0 && pct < 100) {
        const amt = Math.round(nextRegular * (pct / 100));
        setDiscountAmount(pctStr.trim() === '' ? '' : String(amt));
        setPrice(String(Math.max(0, nextRegular - amt)));
      }
    } else if (source === 'amount') {
      const amt = amtStr.trim() === '' ? 0 : Number(amtStr);
      if (Number.isFinite(amt) && amt >= 0) {
        const finalP = Math.max(0, Math.round(nextRegular - amt));
        setPrice(String(finalP));
        if (amtStr.trim() !== '') {
          setDiscountPercent(formatPercent((amt / nextRegular) * 100));
        }
      }
    } else {
      if (priceStr.trim() !== '') {
        const p = Number(priceStr);
        if (Number.isFinite(p) && p >= 0) {
          const amt = Math.max(0, Math.round(nextRegular - p));
          setDiscountAmount(String(amt));
          setDiscountPercent(amt > 0 ? formatPercent((amt / nextRegular) * 100) : '0');
        }
      } else {
        setPrice(String(nextRegular));
      }
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setRows([emptyRow(), emptyRow()]);
    setDiscountPercent('10');
    setDiscountAmount('');
    setPrice('');
    setPricingSource('percent');
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
    const nextRows = rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
    setRows(nextRows);
    recalculateFromRows(nextRows, products);
  };

  const addRow = () => {
    setRows([...rows, emptyRow()]);
  };

  const removeRow = (index: number) => {
    const nextRows = rows.filter((_, i) => i !== index);
    setRows(nextRows);
    recalculateFromRows(nextRows, products);
  };

  const handleDiscountPercentChange = (val: string) => {
    setFormError('');
    setDiscountPercent(val);
    setPricingSource('percent');

    if (val.trim() === '') {
      setDiscountAmount('');
      setPrice(regularPrice > 0 ? String(regularPrice) : '');
      return;
    }

    const pct = Number(val);
    if (!Number.isFinite(pct) || pct < 0) return;

    if (regularPrice > 0) {
      const amt = Math.round(regularPrice * (pct / 100));
      setDiscountAmount(String(amt));
      setPrice(String(Math.max(0, regularPrice - amt)));
    }
  };

  const handleDiscountAmountChange = (val: string) => {
    setFormError('');
    setDiscountAmount(val);
    setPricingSource('amount');

    if (val.trim() === '') {
      setDiscountPercent('');
      setPrice(regularPrice > 0 ? String(regularPrice) : '');
      return;
    }

    const amt = Number(val);
    if (!Number.isFinite(amt) || amt < 0) return;

    if (regularPrice > 0) {
      const finalP = Math.max(0, Math.round(regularPrice - amt));
      setPrice(String(finalP));
      setDiscountPercent(formatPercent((amt / regularPrice) * 100));
    }
  };

  const handlePriceChange = (val: string) => {
    setFormError('');
    setPrice(val);
    setPricingSource('price');

    if (val.trim() === '') {
      setDiscountAmount('');
      setDiscountPercent('');
      return;
    }

    const p = Number(val);
    if (!Number.isFinite(p) || p < 0) return;

    if (regularPrice > 0) {
      const amt = Math.max(0, Math.round(regularPrice - p));
      setDiscountAmount(String(amt));
      setDiscountPercent(amt > 0 ? formatPercent((amt / regularPrice) * 100) : '0');
    }
  };

  const applyPresetDiscount = (pct: number) => {
    handleDiscountPercentChange(String(pct));
  };

  const reportValidationError = (msg: string) => {
    setFormError(msg);
    notify.error(msg);
  };

  const handleSave = async () => {
    const items = rows
      .filter((row) => row.productId)
      .map((row) => ({ productId: row.productId, quantity: Number(row.quantity) }));
    const priceNum = Number(price);
    const pctNum = discountPercent.trim() === '' ? 0 : Number(discountPercent);
    const amtNum = discountAmount.trim() === '' ? 0 : Number(discountAmount);

    if (!name.trim()) return reportValidationError('El nombre del combo es obligatorio.');
    if (new Set(items.map((i) => i.productId)).size < 2) return reportValidationError(MIN_ITEMS_ALERT);
    if (items.some((i) => !Number.isInteger(i.quantity) || i.quantity < 1)) {
      return reportValidationError('La cantidad de cada producto debe ser un número entero mayor o igual a 1.');
    }
    if (!Number.isFinite(pctNum) || pctNum < 0 || pctNum >= 100) {
      return reportValidationError(DISCOUNT_ALERT);
    }
    if (!Number.isFinite(amtNum) || amtNum < 0 || (regularPrice > 0 && amtNum >= regularPrice)) {
      return reportValidationError(DISCOUNT_ALERT);
    }
    if (!Number.isFinite(priceNum) || priceNum <= 0) return reportValidationError(PRICE_ALERT);

    setSaving(true);
    try {
      const res = await fetch(editingId ? `${API.combos}/${editingId}` : API.combos, {
        method: editingId ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          price: priceNum,
          discountPercent: pctNum,
          discountAmount: amtNum,
          items,
          ...(editingId ? { isActive } : {}),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        const msg = errData?.errors?.[0]?.message ?? errData?.message ?? 'No se pudo guardar el combo.';
        setFormError(msg);
        notify.error(msg);
        return;
      }

      const saved = await res.json();
      const wasEditing = editingId !== null;
      await loadCombos();
      closeModal();
      notify.success(
        wasEditing
          ? `Combo "${saved.name}" actualizado exitosamente.`
          : `Combo "${saved.name}" registrado exitosamente con el código ${saved.sku}.`,
        wasEditing ? 'Cambios guardados' : 'Registro exitoso'
      );
    } catch {
      const msg = 'Error de conexión al guardar el combo.';
      setFormError(msg);
      notify.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (combo: Combo) => {
    const metrics = computeComboMetrics(combo);
    setName(combo.name);
    setDescription(combo.description ?? '');
    setPrice(String(metrics.comboPrice));
    setDiscountAmount(metrics.discountAmount > 0 ? String(Math.round(metrics.discountAmount)) : '0');
    setDiscountPercent(formatPercent(metrics.discountPercent));
    setPricingSource('percent');
    setIsActive(combo.isActive);
    setRows(combo.items.map((i) => ({ productId: i.product.id, quantity: String(i.quantity) })));
    setFormError('');
    setEditingId(combo.id);
    setModalOpen(true);
  };

  const handleDelete = async (combo: Combo) => {
    const deleted = await runDeleteAction({
      url: `${API.combos}/${combo.id}`,
      headers: authHeaders(),
      confirmMessage: `¿Deseas eliminar el combo "${combo.name}"? Dejará de estar disponible en el catálogo.`,
      successMessage: 'Combo eliminado exitosamente.',
    });
    if (!deleted) return;
    setCombos((prev) => prev.filter((c) => c.id !== combo.id));
  };

  const effectiveDiscountAmount =
    regularPrice > 0 && Number(price) > 0 ? Math.max(0, regularPrice - Number(price)) : 0;
  const effectiveDiscountPercent =
    regularPrice > 0 && effectiveDiscountAmount > 0
      ? formatPercent((effectiveDiscountAmount / regularPrice) * 100)
      : '0';

  return (
    <>
      <div className="productos-page combos-page">
        <div className="productos-topbar">
          <div>
            <h2 className="titulo-productos">Combos escolares</h2>
            <p className="subtitulo-usuarios">
              Agrupa productos del catálogo en un paquete con precio especial
            </p>
          </div>
          <button className="btn-nuevo-producto" onClick={openModal}>
            + Nuevo combo
          </button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text)', padding: '20px 0' }}>Cargando combos...</p>
        ) : (
          <table className="tabla-productos tabla-combos">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Combo</th>
                <th>Valor normal</th>
                <th>Descuento</th>
                <th>Precio combo</th>
                <th>Disponibles</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {combos.map((combo) => {
                const { regularPrice: basePrice, comboPrice, discountAmount: savedAmt, discountPercent: savedPct } =
                  computeComboMetrics(combo);

                return (
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
                    <td>
                      {basePrice > comboPrice ? (
                        <span className="combo-precio-regular">${basePrice.toLocaleString('es-CO')}</span>
                      ) : (
                        <span>${basePrice.toLocaleString('es-CO')}</span>
                      )}
                    </td>
                    <td>
                      {savedAmt > 0 ? (
                        <span className="combo-descuento-badge">
                          −${Math.round(savedAmt).toLocaleString('es-CO')} ({formatPercent(savedPct)}%)
                        </span>
                      ) : (
                        <span className="combo-sin-descuento">Sin dcto.</span>
                      )}
                    </td>
                    <td className="precio-producto">${comboPrice.toLocaleString('es-CO')}</td>
                    <td>
                      <span
                        className={`stock-badge ${combo.availableStock > 0 ? 'stock-ok' : 'stock-agotado'}`}
                      >
                        {combo.availableStock} {combo.availableStock === 1 ? 'combo' : 'combos'}
                      </span>
                    </td>
                    <td>
                      <span className={`combo-estado-pill ${combo.isActive ? 'activo' : 'inactivo'}`}>
                        {combo.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <button className="btn-editar-producto" onClick={() => handleEdit(combo)}>
                        Editar
                      </button>
                      <button className="btn-eliminar-producto" onClick={() => handleDelete(combo)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
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
            maxLength={150}
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
            maxLength={500}
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
                    {p.name} — ${Number(p.price).toLocaleString('es-CO')} (stock {p.stock})
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

          <div className="combo-descuento-header">
            <span className="label-producto" style={{ margin: 0 }}>
              Configuración de descuento automático
            </span>
            <div className="combo-presets">
              {PRESET_DISCOUNTS.map((pct) => (
                <button
                  key={pct}
                  type="button"
                  className={`combo-preset-chip ${Number(discountPercent) === pct ? 'active' : ''}`}
                  onClick={() => applyPresetDiscount(pct)}
                >
                  −{pct}%
                </button>
              ))}
            </div>
          </div>

          <div className="fila-3-col combo-precios-grid">
            <div>
              <label className="label-producto" title="Porcentaje de descuento aplicado sobre el valor sumado">
                Descuento (%)
              </label>
              <input
                className="input-producto"
                type="number"
                min="0"
                max="99.9"
                step="0.5"
                value={discountPercent}
                onChange={(e) => handleDiscountPercentChange(e.target.value)}
                placeholder="Ej. 10"
              />
            </div>

            <div>
              <label className="label-producto" title="Valor en pesos colombianos descontado automáticamente">
                Valor dcto. ($)
              </label>
              <input
                className="input-producto"
                type="number"
                min="0"
                step="100"
                value={discountAmount}
                onChange={(e) => handleDiscountAmountChange(e.target.value)}
                placeholder={regularPrice > 0 ? 'Ej. 5000' : '0'}
              />
            </div>

            <div>
              <label className="label-producto" title="Precio final calculado automáticamente para el combo">
                Precio final ($) <span className="campo-obligatorio">*</span>
              </label>
              <input
                className="input-producto"
                type="number"
                min="1"
                value={price}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder="Auto"
              />
            </div>
          </div>

          <div className="combo-resumen-descuento">
            <div className="combo-resumen-linea">
              <span>Valor normal por separado:</span>
              <strong>${regularPrice.toLocaleString('es-CO')} COP</strong>
            </div>
            <div className="combo-resumen-linea combo-resumen-ahorro">
              <span>Descuento aplicado:</span>
              <strong>
                −${Math.round(effectiveDiscountAmount).toLocaleString('es-CO')} COP ({effectiveDiscountPercent}%)
              </strong>
            </div>
            <div className="combo-resumen-linea combo-resumen-total">
              <span>Precio final del combo:</span>
              <strong>${(Number(price) > 0 ? Number(price) : 0).toLocaleString('es-CO')} COP</strong>
            </div>
          </div>

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