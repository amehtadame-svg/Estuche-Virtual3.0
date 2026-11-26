import ReferenceSelect from '../../../components/ui/ReferenceSelect';
import { shortReference } from '../../../lib/reference';
import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import './OrderDetails.css';
import { API, authHeaders } from '../../../api/api';

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
  const [message, setMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadDetails = () => {
    fetch(API.orderDetails, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
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
    if (!form.orderId || !form.productId || !form.quantity || !form.unitPrice) {
      showMessage('Por favor completa todos los campos.');
      return;
    }

    const body = {
      orderId: form.orderId,
      productId: form.productId,
      quantity: Number(form.quantity),
      unitPrice: Number(form.unitPrice),
    };

    try {
      if (editingId !== null) {
        await fetch(`${API.orderDetails}/${editingId}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(body),
        });
        showMessage('Detalle actualizado.');
      } else {
        await fetch(API.orderDetails, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(body),
        });
        showMessage('Artículo agregado.');
      }
      loadDetails();
      closeModal();
    } catch {
      showMessage('Error al procesar la operación.');
    }
  };

  const handleEdit = (d: OrderDetail) => {
    setForm({
      orderId: String(d.orderId),
      productId: String(d.productId),
      quantity: String(d.quantity),
      unitPrice: String(d.unitPrice),
    });
    setEditingId(d.id);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API.orderDetails}/${id}`, { method: 'DELETE', headers: authHeaders() });
      setDetails(details.filter((d) => d.id !== id));
      showMessage('Artículo eliminado.');
    } catch {
      showMessage('Error al eliminar el registro.');
    }
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
                        <button className="btn-eliminar-detalle-pedido" onClick={() => handleDelete(d.id)}>Eliminar</button>
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
              <button className="btn-cancelar-detalle-pedido" onClick={closeModal}>Cancelar</button>
              <button className="btn-guardar-detalle-pedido" onClick={handleSave}>
                {editingId !== null ? 'Guardar cambios' : 'Agregar artículo'}
              </button>
            </>
          }
        >
          <label className="label-detalle-pedido">Pedido</label>
          <ReferenceSelect endpoint={API.orders} kind="order" className="input-detalle-pedido" name="orderId" value={form.orderId} onChange={handleChange} />

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