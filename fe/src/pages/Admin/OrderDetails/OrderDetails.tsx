import ReferenceSelect from '../../../components/ui/ReferenceSelect';
import { shortReference } from '../../../lib/reference';
import { useState, useEffect, useRef } from 'react';
import Modal from '../../../components/ui/Modal';
import './OrderDetails.css';
import { API, authHeaders } from '../../../api/api';
import { notify, requestConfirmation } from '../../../lib/notifications';

const emptyForm = { orderId: '', productId: '', quantity: '', unitPrice: '' };

interface OrderDetail {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product?: { name: string } | null;
}

export default function OrderDetails() {
  const [details, setDetails] = useState<OrderDetail[]>([]);
  const [filtered, setFiltered] = useState<OrderDetail[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [original, setOriginal] = useState<OrderDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const deletesRef = useRef(new Set<string>());
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadDetails = () => {
    fetch(API.orderDetails, { headers: authHeaders() })
      .then((r) => { if (!r.ok) throw new Error('load'); return r.json(); })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('format');
        setDetails(data);
        setFiltered(data);
        setLoading(false);
      })
      .catch(() => {
        showMessage('Error al cargar los detalles del pedido.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!search) {
      setFiltered(details);
      return;
    }
    setFiltered(
      details.filter(
        (d) =>
          String(d.orderId).toLowerCase().includes(search.toLowerCase()) ||
          (d.product?.name ?? '').toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, details]);

  const showMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 2500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openNewModal = () => {
    setFormError('');
    setForm(emptyForm);
    setEditingId(null);
    setOriginal(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (savingRef.current) return;
    setFormError('');
    setModalOpen(false);
    setEditingId(null);
    setOriginal(null);
    setForm(emptyForm);
  };

  const snapshot = (d: OrderDetail) => ({ orderId: d.orderId, productId: d.productId, quantity: d.quantity, unitPrice: Number(d.unitPrice) });

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!form.orderId || !form.productId || !form.quantity || form.unitPrice === '') {
      setFormError('Completa los campos obligatorios antes de guardar.'); return;
    }
    const body = { orderId: form.orderId.trim(), productId: form.productId.trim(), quantity: Number(form.quantity), unitPrice: Number(form.unitPrice) };
    if (!Number.isInteger(body.quantity) || body.quantity < 1 || !Number.isFinite(body.unitPrice) || body.unitPrice < 0) {
      setFormError('Indica una cantidad entera mayor que cero y un precio válido.'); return;
    }
    if (editingId && original && body.orderId !== original.orderId) {
      setFormError('No se puede trasladar el artículo a otro pedido desde este formulario.'); return;
    }
    if (editingId && original && body.orderId === original.orderId && body.productId === original.productId && body.quantity === original.quantity && body.unitPrice === Number(original.unitPrice)) {
      setFormError('No hay cambios para guardar. Puedes cerrar el formulario con Cancelar.'); return;
    }
    setFormError('');
    if (!editingId) {
      savingRef.current = true; setSaving(true);
      try {
        const response = await fetch(API.orderDetails, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          setFormError(payload?.message || 'No se pudo guardar el artículo del pedido.');
          return;
        }
        savingRef.current = false;
        closeModal();
        loadDetails();
        notify.success('El artículo se agregó correctamente al pedido.', 'Artículo agregado');
      } catch {
        setFormError('No se pudo confirmar el registro. Actualiza la lista y verifica el pedido antes de intentarlo de nuevo.');
      } finally { savingRef.current = false; setSaving(false); }
      return;
    }
    if (!original) { setFormError('Actualiza la lista antes de intentar guardar.'); return; }
    savingRef.current = true; setSaving(true);
    try {
      const response = await fetch(`${API.orderDetails}/${editingId}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ ...body, expected: snapshot(original) }) });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setFormError(payload?.message || 'No se pudo guardar el artículo. Revisa los datos e inténtalo de nuevo.'); return;
      }
      savingRef.current = false; closeModal(); loadDetails();
      notify.success('El artículo se actualizó y se ajustaron el pedido, el recibo y la reserva de inventario.', 'Cambios guardados');
    } catch {
      setFormError('No se pudo confirmar el guardado. Actualiza la lista y verifica el pedido antes de intentarlo de nuevo.');
    } finally { savingRef.current = false; setSaving(false); }
  };

  const handleEdit = (d: OrderDetail) => {
    setFormError('');
    setForm({ orderId: String(d.orderId), productId: String(d.productId), quantity: String(d.quantity), unitPrice: String(d.unitPrice) });
    setOriginal(d); setEditingId(d.id); setModalOpen(true);
  };

  const handleDelete = async (d: OrderDetail) => {
    if (deletesRef.current.has(d.id)) return;
    deletesRef.current.add(d.id);
    try {
      if (!(await requestConfirmation('¿Deseas eliminar este artículo del pedido? Si el pedido permite el cambio, se ajustarán el inventario, el total y el recibo.'))) return;
      const response = await fetch(`${API.orderDetails}/${d.id}`, { method: 'DELETE', headers: authHeaders(), body: JSON.stringify({ expected: snapshot(d) }) });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        notify.error(payload?.message || 'No se pudo eliminar el artículo. Revisa el pedido antes de intentarlo de nuevo.', 'No se eliminó el artículo'); return;
      }
      setDetails((current) => current.filter((item) => item.id !== d.id));
      notify.success('El artículo se retiró y se ajustaron el pedido, el recibo y la reserva de inventario.', 'Artículo retirado');
    } catch {
      notify.error('No se pudo confirmar la eliminación. Actualiza la lista y verifica el pedido antes de intentarlo de nuevo.', 'No se pudo confirmar');
    } finally { deletesRef.current.delete(d.id); }
  };

  const grandTotal = filtered.reduce((acc, d) => acc + Number(d.subtotal ?? d.quantity * d.unitPrice), 0);

  return (
    <>
      <div className="detalle-pedidos-page">
        <div className="detalle-pedidos-topbar">
          <div>
            <h2 className="titulo-detalle-pedidos">Detalle de Pedidos</h2>
            <p className="subtitulo-detalle-pedidos">Administra los artículos asignados a cada orden de compra</p>
          </div>
          <button className="btn-nuevo-detalle-pedido" onClick={openNewModal}>
            + Nuevo artículo
          </button>
        </div>

        <div className="detalle-pedidos-filtros">
          <input
            className="detalle-pedidos-busqueda"
            type="search"
            aria-label="Buscar artículos de pedidos"
            placeholder="Buscar por N° pedido o producto..."
            maxLength={150}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {message && <div className="mensaje-detalle-pedidos">{message}</div>}

        {loading ? (
          <p className="detalle-pedidos-cargando">Cargando artículos...</p>
        ) : (
          <>
            <table className="tabla-detalle-pedidos">
              <thead>
                <tr>
                  <th>N° Pedido</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio unitario</th>
                  <th>Subtotal</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="table-empty">
                      {search ? 'Ningún artículo coincide con la búsqueda.' : 'Todavía no hay artículos asignados a pedidos.'}
                    </td>
                  </tr>
                )}
                {filtered.map((d) => {
                  const subtotal = d.subtotal ?? d.quantity * d.unitPrice;
                  return (
                    <tr key={d.id}>
                      <td className="numero-detalle-pedido">PED-{shortReference(d.orderId)}</td>
                      <td className="producto-detalle-pedido">{d.product?.name ?? `Producto #${shortReference(d.productId)}`}</td>
                      <td>{d.quantity}</td>
                      <td>${Number(d.unitPrice).toLocaleString()}</td>
                      <td className="subtotal-detalle-pedido">${Number(subtotal).toLocaleString()}</td>
                      <td>
                        <button className="btn-editar-detalle-pedido" onClick={() => handleEdit(d)}>Editar</button>
                        <button className="btn-eliminar-detalle-pedido" onClick={() => handleDelete(d)}>Eliminar</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>



            {filtered.length > 0 && (
              <div className="detalle-pedidos-total">
                <span>Total general</span>
                <span>${grandTotal.toLocaleString()}</span>
              </div>
            )}
          </>
        )}
      </div>

      {modalOpen && (
        <Modal
          titulo={editingId !== null ? 'Editar artículo' : 'Nuevo artículo'}
          onClose={closeModal}
          footer={
            <>
              <button className="btn-cancelar-detalle-pedido" onClick={closeModal} disabled={saving}>Cancelar</button>
              <button className="btn-guardar-detalle-pedido" onClick={handleSave} disabled={saving}>
                {editingId !== null ? 'Guardar cambios' : 'Agregar artículo'}
              </button>
            </>
          }
        >
          {formError && <div className="mensaje-detalle-pedidos" role="alert">{formError}</div>}
          <label className="label-detalle-pedido">Pedido</label>
          <ReferenceSelect endpoint={API.orders} kind="order" className="input-detalle-pedido" name="orderId" value={form.orderId} onChange={handleChange} disabled={editingId !== null} />

          <label className="label-detalle-pedido">Producto</label>
          <ReferenceSelect endpoint={API.products} kind="product" className="input-detalle-pedido" name="productId" value={form.productId} onChange={handleChange} />

          <label className="label-detalle-pedido">Cantidad</label>
          <input className="input-detalle-pedido" type="number" name="quantity" value={form.quantity} onChange={handleChange} placeholder="Unidades" />

          <label className="label-detalle-pedido">Precio unitario</label>
          <input className="input-detalle-pedido" type="number" name="unitPrice" value={form.unitPrice} onChange={handleChange} placeholder="Valor unitario" />
        </Modal>
      )}
    </>
  );
}
