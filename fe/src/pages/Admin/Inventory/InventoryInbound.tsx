import { useState, useEffect, useMemo } from 'react';
import { API, authHeaders } from '../../../api/api';
import './InventoryInbound.css';

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
  supplier?: { id?: string; name: string } | null;
  images?: { url: string; isPrimary?: boolean }[];
}

interface ProviderItem {
  id: string;
  name: string;
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

const QUANTITY_ERROR_MSG =
  'La cantidad de mercancía a ingresar debe ser un número entero mayor a cero';

export default function InventoryInbound() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [movements, setMovements] = useState<MovementRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscador y selección (CA-002.1)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');

  // Formulario de ingreso (CA-002.2 / CA-002.3)
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [reason, setReason] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, provRes, movRes] = await Promise.all([
        fetch(API.products, { headers: authHeaders() }),
        fetch(API.providers, { headers: authHeaders() }),
        fetch(`${API.inventory}/movements?type=in`, { headers: authHeaders() }),
      ]);

      if (prodRes.ok) {
        const data = await prodRes.json();
        if (Array.isArray(data)) setProducts(data);
      }
      if (provRes.ok) {
        const data = await provRes.json();
        if (Array.isArray(data)) setProviders(data);
      }
      if (movRes.ok) {
        const data = await movRes.json();
        if (Array.isArray(data)) setMovements(data);
      }
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

  const handleSelectProduct = (prod: ProductItem) => {
    setSelectedProductId(prod.id);
    setUnitCost(prod.cost && Number(prod.cost) > 0 ? String(prod.cost) : '');
    setError('');
    setSuccessMsg('');
  };

  const parsedQty = Number(quantity);
  const isQuantityValid = quantity.trim() !== '' && Number.isInteger(parsedQty) && parsedQty > 0;

  const handleQuantityChange = (val: string) => {
    setQuantity(val);
    const n = Number(val);
    if (val.trim() === '' || !Number.isInteger(n) || n <= 0) {
      setError(QUANTITY_ERROR_MSG);
    } else {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');

    if (!selectedProduct) {
      setError('Selecciona primero un producto del catálogo para registrar el ingreso.');
      return;
    }

    if (!isQuantityValid) {
      setError(QUANTITY_ERROR_MSG);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API.inventory}/inbound`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          productId: selectedProduct.id,
          quantity: parsedQty,
          unitCost: unitCost ? Number(unitCost) : undefined,
          supplierId: supplierId || null,
          invoiceNumber: invoiceNumber.trim() || null,
          reason: reason.trim() || null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        setError(errData?.message || QUANTITY_ERROR_MSG);
        return;
      }

      const data = await res.json();
      setSuccessMsg(
        `Ingreso confirmado: "${selectedProduct.name}" pasó de ${data.previousStock} a ${data.newStock} unidades (+${parsedQty}).`
      );
      setQuantity('');
      setInvoiceNumber('');
      setReason('');
      await loadData();
    } catch {
      setError('Error de conexión al registrar el ingreso de mercancía.');
    } finally {
      setSubmitting(false);
    }
  };

  const primaryImage =
    selectedProduct?.images?.find((i) => i.isPrimary)?.url ??
    selectedProduct?.images?.[0]?.url ??
    '';

  return (
    <div className="inbound-page">
      <div className="inbound-header">
        <div>
          <h1 className="inbound-title">Recepción e Ingreso de Mercancía (HU-002)</h1>
          <p className="inbound-subtitle">
            Registra lotes recibidos de proveedores para incrementar el stock en tiempo real y auditar entradas
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
        {/* Columna izquierda: Búsqueda interactiva y ficha del producto (CA-002.1) */}
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
                  className={`inbound-product-item ${
                    selectedProductId === prod.id ? 'active' : ''
                  }`}
                  onClick={() => handleSelectProduct(prod)}
                >
                  <div>
                    <strong>{prod.name}</strong>
                    <small>
                      SKU: {prod.sku || '—'} · Categoría: {prod.category?.name || 'Sin categoría'}
                    </small>
                  </div>
                  <span className="inbound-stock-pill">Stock: {prod.stock}</span>
                </button>
              ))
            )}
          </div>

          {/* Ficha resumida del producto seleccionado (CA-002.1) */}
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
                  <span>SKU:</span> <strong>{selectedProduct.sku || '—'}</strong> ·{' '}
                  <span>Categoría:</span>{' '}
                  <strong>{selectedProduct.category?.name || 'Sin categoría'}</strong>
                </p>
                <p>
                  <span>Costo adquisición actual:</span>{' '}
                  <strong>${Number(selectedProduct.cost ?? 0).toLocaleString()} COP</strong>
                </p>
                <div className="inbound-stock-preview">
                  <div>
                    <small>Stock actual en bodega</small>
                    <b>{selectedProduct.stock} uds.</b>
                  </div>
                  {isQuantityValid && (
                    <>
                      <span className="inbound-arrow">+{parsedQty} ➔</span>
                      <div className="inbound-new-stock">
                        <small>Nuevo stock tras ingreso</small>
                        <b>{selectedProduct.stock + parsedQty} uds.</b>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Columna derecha: Formulario de entrada de lote (CA-002.2 y CA-002.3) */}
        <form className="inbound-card" onSubmit={handleSubmit}>
          <h2 className="inbound-card-title">2. Datos del lote de entrada</h2>

          <label className="inbound-label">
            Cantidad a Ingresar <span className="inbound-req">*</span>
          </label>
          <input
            type="number"
            min="1"
            step="1"
            className={`inbound-input ${quantity !== '' && !isQuantityValid ? 'invalid' : ''}`}
            placeholder="Ej. 25"
            value={quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
          />

          <div className="inbound-row-2">
            <div>
              <label className="inbound-label">Costo unitario de compra ($ COP)</label>
              <input
                type="number"
                min="1"
                className="inbound-input"
                placeholder="Ej. 7500"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
              />
            </div>

            <div>
              <label className="inbound-label">N° de Factura / Lote</label>
              <input
                type="text"
                className="inbound-input"
                placeholder="Ej. FAC-2026-089"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>
          </div>

          <label className="inbound-label">Proveedor emisor</label>
          <select
            className="inbound-input"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
          >
            <option value="">Selecciona proveedor (opcional)</option>
            {providers.map((prov) => (
              <option key={prov.id} value={prov.id}>
                {prov.name}
              </option>
            ))}
          </select>

          <label className="inbound-label">Observaciones / Motivo de recepción</label>
          <textarea
            className="inbound-input"
            rows={2}
            placeholder="Ej. Reposición mensual de temporada escolar..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <button
            type="submit"
            className="inbound-submit-btn"
            disabled={!selectedProduct || !isQuantityValid || submitting}
          >
            {submitting ? 'Procesando ingreso...' : 'Confirmar Ingreso'}
          </button>
        </form>
      </div>

      {/* Bitácora de auditoría de recepciones recientes (CA-002.4) */}
      <div className="inbound-card inbound-history-card">
        <h2 className="inbound-card-title">
          Bitácora de Ingresos de Mercancía Recientes (`inventory_movements`)
        </h2>
        {movements.length === 0 ? (
          <p className="inbound-muted">Aún no se han registrado entradas de mercancía.</p>
        ) : (
          <table className="inbound-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>SKU</th>
                <th>Producto</th>
                <th>Cantidad Adicionada</th>
                <th>Detalle / Lote / Factura</th>
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
                    <span className="inbound-qty-badge">+{m.quantity} uds.</span>
                  </td>
                  <td>{m.reason || 'Ingreso de mercancía'}</td>
                  <td>{m.user?.fullName || 'Administrador'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}