import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { API, authHeaders } from '../../../api/api';
// Reutiliza el shell visual del módulo de inventario (tarjetas, tabla, inputs)
import './InventoryInbound.css';
import './InventoryOutbound.css';

interface ProductItem {
  id: string;
  sku?: string | null;
  barcode?: string | null;
  name: string;
  cost?: number;
  price: number;
  stock: number;
  stockMin: number;
  category?: { id?: string; name: string } | null;
  images?: { url: string; isPrimary?: boolean }[];
}

interface MovementRecord {
  id: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string | null;
  date: string;
  product?: {
    id: string;
    name: string;
    sku?: string | null;
    stock: number;
  };
  user?: {
    fullName: string;
  } | null;
}

const FALLBACK_REASONS = [
  'Traslado entre sucursales',
  'Muestra comercial',
  'Consumo interno',
  'Merma por daño',
  'Devolución a proveedor',
  'Otro',
];

const QUANTITY_ERROR_MSG = 'La cantidad a retirar debe ser un número entero mayor a cero';
const REASON_ERROR_MSG = 'La justificación del retiro es obligatoria (mínimo 3 caracteres)';

export default function InventoryOutbound() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [movements, setMovements] = useState<MovementRecord[]>([]);
  const [reasons, setReasons] = useState<string[]>(FALLBACK_REASONS);
  const [loading, setLoading] = useState(true);

  // CA-003.1 · búsqueda y selección de producto
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');

  // CA-003.1 · datos del retiro
  const [quantity, setQuantity] = useState('');
  const [reasonType, setReasonType] = useState('');
  const [reasonDetail, setReasonDetail] = useState('');

  // CA-003.4 · modal de confirmación previa
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, movRes, reasonRes] = await Promise.all([
        fetch(API.products, { headers: authHeaders() }),
        fetch(`${API.inventory}/movements?type=out`, { headers: authHeaders() }),
        fetch(`${API.inventory}/outbound/reasons`, { headers: authHeaders() }),
      ]);

      if (prodRes.ok) {
        const data = await prodRes.json();
        if (Array.isArray(data)) setProducts(data);
      }
      if (movRes.ok) {
        const data = await movRes.json();
        if (Array.isArray(data)) setMovements(data);
      }
      if (reasonRes.ok) {
        const data = await reasonRes.json();
        if (Array.isArray(data) && data.length > 0) setReasons(data);
      }
    } catch {
      setError('No se pudo cargar la información del inventario.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
    );
  }, [products, searchQuery]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) ?? null,
    [products, selectedProductId]
  );

  const parsedQty = Number(quantity);
  const isQuantityValid = quantity.trim() !== '' && Number.isInteger(parsedQty) && parsedQty > 0;

  // CA-003.3 · aviso preventivo cuando la cantidad excede el stock
  const exceedsStock = Boolean(selectedProduct) && isQuantityValid && parsedQty > selectedProduct!.stock;
  const isReasonValid = reasonType !== '' && reasonDetail.trim().length >= 3;
  const canSubmit = Boolean(selectedProduct) && isQuantityValid && !exceedsStock && isReasonValid;

  const handleSelectProduct = (prod: ProductItem) => {
    setSelectedProductId(prod.id);
    setError('');
    setSuccessMsg('');
    setShowConfirm(false);
  };

  const handleQuantityChange = (val: string) => {
    setQuantity(val);
    setShowConfirm(false);
  };

  // CA-003.4 · el submit abre el modal, no llama al backend todavía
  const handlePreSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');

    if (!selectedProduct) {
      setError('Selecciona primero un producto del catálogo para registrar la salida.');
      return;
    }
    if (!isQuantityValid) {
      setError(QUANTITY_ERROR_MSG);
      return;
    }
    if (exceedsStock) {
      setError(
        `No se puede procesar la salida: La cantidad solicitada excede el stock actual disponible en el almacén (Disponible: ${selectedProduct.stock} unidades)`
      );
      return;
    }
    if (!isReasonValid) {
      setError(REASON_ERROR_MSG);
      return;
    }

    setError('');
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (!selectedProduct) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API.inventory}/outbound`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          productId: selectedProduct.id,
          quantity: parsedQty,
          reasonType,
          reason: reasonDetail.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        setError(errData?.message || 'No se pudo registrar la salida de mercancía.');
        setShowConfirm(false);
        return;
      }

      const data = await res.json();
      setShowConfirm(false);
      setSuccessMsg(
        `Salida confirmada: "${selectedProduct.name}" pasó de ${data.previousStock} a ${data.newStock} unidades (−${parsedQty}).`
      );
      setQuantity('');
      setReasonType('');
      setReasonDetail('');
      await loadData();
    } catch {
      setError('Error de conexión al registrar la salida de mercancía.');
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const primaryImage =
    selectedProduct?.images?.find((i) => i.isPrimary)?.url ?? selectedProduct?.images?.[0]?.url ?? '';

  return (
    <div className="inbound-page">
      <div className="inbound-header">
        <div>
          <h1 className="inbound-title">Salida Manual de Productos (HU-003)</h1>
          <p className="inbound-subtitle">
            Registra retiros que no son ventas (traslados, muestras, consumo interno o mermas) y descuenta el stock
            con trazabilidad de auditoría
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="inbound-alert-success" role="status">
          ✅ {successMsg}
        </div>
      )}

      {error && (
        <div className="inbound-alert-error" role="alert">
          ⚠️ {error}
        </div>
      )}

      <div className="inbound-grid">
        {/* CA-003.1 · selección del producto a retirar */}
        <div className="inbound-card">
          <h2 className="inbound-card-title">1. Buscar y seleccionar producto</h2>
          <input
            type="text"
            className="inbound-input"
            placeholder="🔍 Escribe nombre, código SKU (ej. EV-001) o código de barras..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="inbound-product-list">
            {loading ? (
              <p className="inbound-muted">Cargando productos...</p>
            ) : filteredProducts.length === 0 ? (
              <p className="inbound-muted">No hay productos que coincidan con la búsqueda.</p>
            ) : (
              filteredProducts.slice(0, 8).map((prod) => (
                <button
                  type="button"
                  key={prod.id}
                  className={`inbound-product-item ${selectedProductId === prod.id ? 'active' : ''}`}
                  onClick={() => handleSelectProduct(prod)}
                >
                  <div>
                    <strong>{prod.name}</strong>
                    <small>
                      SKU: {prod.sku || '—'} · Categoría: {prod.category?.name || 'Sin categoría'}
                    </small>
                  </div>
                  <span className={`inbound-stock-pill ${prod.stock === 0 ? 'empty' : ''}`}>
                    Stock: {prod.stock}
                  </span>
                </button>
              ))
            )}
          </div>

          {selectedProduct && (
            <div className="inbound-product-summary">
              <div className="inbound-summary-img-wrap">
                {primaryImage ? (
                  <img src={primaryImage} alt={selectedProduct.name} />
                ) : (
                  <span className="inbound-no-img">📦</span>
                )}
              </div>
              <div className="inbound-summary-info">
                <h3>{selectedProduct.name}</h3>
                <p>
                  <span>SKU:</span> <strong>{selectedProduct.sku || '—'}</strong> · <span>Categoría:</span>{' '}
                  <strong>{selectedProduct.category?.name || 'Sin categoría'}</strong>
                </p>
                <p>
                  <span>Punto de reorden:</span> <strong>{selectedProduct.stockMin} uds.</strong>
                </p>
                <div className="inbound-stock-preview">
                  <div>
                    <small>Stock actual en bodega</small>
                    <b>{selectedProduct.stock} uds.</b>
                  </div>
                  {isQuantityValid && !exceedsStock && (
                    <>
                      <span className="outbound-arrow">−{parsedQty} ➔</span>
                      <div className="inbound-new-stock">
                        <small>Stock tras la salida</small>
                        <b className="outbound-new-stock">{selectedProduct.stock - parsedQty} uds.</b>
                      </div>
                    </>
                  )}
                  {exceedsStock && (
                    <div className="outbound-shortage">
                      ⚠️ Disponible: {selectedProduct.stock} uds. — solicitadas: {parsedQty}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CA-003.1 · datos del retiro */}
        <form className="inbound-card" onSubmit={handlePreSubmit}>
          <h2 className="inbound-card-title">2. Datos de la salida</h2>

          <label className="inbound-label">
            Cantidad a Retirar <span className="inbound-req">*</span>
          </label>
          <input
            type="number"
            min="1"
            step="1"
            className={`inbound-input ${quantity !== '' && !isQuantityValid ? 'invalid' : ''}`}
            placeholder="Ej. 10"
            value={quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
          />

          <label className="inbound-label">
            Motivo del Retiro <span className="inbound-req">*</span>
          </label>
          <select
            className="inbound-input"
            value={reasonType}
            onChange={(e) => {
              setReasonType(e.target.value);
              setShowConfirm(false);
            }}
          >
            <option value="">Selecciona el motivo del egreso</option>
            {reasons.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <label className="inbound-label">
            Justificación / Observaciones <span className="inbound-req">*</span>
          </label>
          <textarea
            className="inbound-input"
            rows={3}
            placeholder="Ej. Traslado de 10 cuadernos a la sede norte para reposición de vitrina"
            value={reasonDetail}
            onChange={(e) => {
              setReasonDetail(e.target.value);
              setShowConfirm(false);
            }}
          />

          <button type="submit" className="outbound-submit-btn" disabled={!canSubmit || submitting}>
            {submitting ? 'Procesando salida...' : 'Procesar Salida'}
          </button>

          {!canSubmit && !submitting && (
            <p className="inbound-muted outbound-hint">
              Completa producto, cantidad válida, motivo y justificación para habilitar el registro.
            </p>
          )}
        </form>
      </div>

      {/* Bitácora de salidas manuales */}
      <div className="inbound-card inbound-history-card">
        <h2 className="inbound-card-title">Bitácora de Salidas Manuales (`inventory_movements`)</h2>
        {movements.length === 0 ? (
          <p className="inbound-muted">Aún no se han registrado salidas de mercancía.</p>
        ) : (
          <table className="inbound-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>SKU</th>
                <th>Producto</th>
                <th>Cantidad Retirada</th>
                <th>Motivo / Justificación</th>
                <th>Responsable</th>
              </tr>
            </thead>
            <tbody>
              {movements.slice(0, 15).map((m) => (
                <tr key={m.id}>
                  <td>{new Date(m.date).toLocaleString('es-CO')}</td>
                  <td>
                    <span className="inbound-sku">{m.product?.sku || '—'}</span>
                  </td>
                  <td>
                    <strong>{m.product?.name || '—'}</strong>
                  </td>
                  <td>
                    <span className="outbound-qty-badge">−{m.quantity} uds.</span>
                  </td>
                  <td>{m.reason || 'Salida manual'}</td>
                  <td>{m.user?.fullName || 'Administrador'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* CA-003.4 · modal de confirmación previa */}
      {showConfirm && selectedProduct && (
        <div className="outbound-modal-backdrop" role="dialog" aria-modal="true">
          <div className="outbound-modal">
            <h3 className="outbound-modal-title">Confirmar salida de mercancía</h3>
            <p className="outbound-modal-text">
              Esta acción descontará existencias de forma permanente. Revisa el resumen antes de continuar.
            </p>

            <dl className="outbound-modal-list">
              <div>
                <dt>Producto</dt>
                <dd>{selectedProduct.name}</dd>
              </div>
              <div>
                <dt>SKU</dt>
                <dd>{selectedProduct.sku || '—'}</dd>
              </div>
              <div>
                <dt>Cantidad a retirar</dt>
                <dd>
                  <strong>{parsedQty} uds.</strong>
                </dd>
              </div>
              <div>
                <dt>Motivo</dt>
                <dd>{reasonType}</dd>
              </div>
              <div>
                <dt>Justificación</dt>
                <dd>{reasonDetail.trim()}</dd>
              </div>
              <div>
                <dt>Stock resultante</dt>
                <dd>
                  {selectedProduct.stock} ➔ <strong>{selectedProduct.stock - parsedQty} uds.</strong>
                </dd>
              </div>
            </dl>

            <div className="outbound-modal-actions">
              <button
                type="button"
                className="outbound-btn-cancel"
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="outbound-btn-confirm"
                onClick={handleConfirm}
                disabled={submitting}
              >
                {submitting ? 'Procesando...' : 'Confirmar salida'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}