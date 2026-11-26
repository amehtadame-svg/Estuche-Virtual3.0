import { Link } from 'react-router-dom';
import { shortReference } from '../../../lib/reference';
import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import { API, authHeaders } from '../../../api/api';
import { runDeleteAction } from '../../../lib/deleteAction';
import { runApiAction } from '../../../lib/apiAction';
import { notify } from '../../../lib/notifications';
import { orderStatusLabel } from '../../../lib/statusLabels';
import './Orders.css';

const statusTone: Record<string, string> = {
  pending: 'tone-info',
  shipped: 'tone-warning',
  delivered: 'tone-success',
  canceled: 'tone-danger',
};

const emptyForm = {
  customerId: '',
  productId: '',
  quantity: '1',
  deliveryAddress: '',
  fulfillmentMethod: 'delivery',
  total: '',
  status: 'pending',
  promotionalCodeId: '',
};

interface ProductOption {
  id: string;
  name: string;
  price: number | null;
  stock: number | null;
}

interface Customer {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

interface Order {
  id: string;
  customerId: string | null;
  createdById: string | null;
  work: { id: string } | null;
  total: number | null;
  status: string | null;
  orderDate: string | null;
  customer: { fullName: string } | null;
  promotionalCode: { code: string; value: number } | null;
  driver: { fullName: string } | null;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductOption[]>([]);

  const loadOrders = () => {
    fetch(API.orders, { headers: authHeaders() })
      .then((r) => { if (!r.ok) throw new Error('No se pudieron cargar los pedidos.'); return r.json(); })
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        showMessage('Error al cargar pedidos.');
        setLoading(false);
      });
  };

  const loadCustomers = async () => {
    try {
      const response = await fetch(API.users, {
        headers: authHeaders(),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || 'No se pudieron cargar los clientes.'
        );
      }

      setCustomers(
        Array.isArray(data)
          ? data.filter((user: Customer) => user.role === 'client')
          : []
      );
    } catch {
      notify.error(
        'No se pudieron cargar los clientes para el pedido.'
      );
    }
  };

  const loadProducts = async () => {
    try {
      const response = await fetch(API.products, { headers: authHeaders() });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      notify.error('No se pudieron cargar los productos para el pedido.');
    }
  };

  useEffect(() => {
    loadOrders();
    loadCustomers();
    loadProducts();
  }, []);

  const showMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 2500);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setDiscountCode('');
    setDiscountApplied(null);
  };

  const handleSave = async () => {
    // A-01/A-02: el backend exige al menos un producto y dirección si es domicilio.
    if (!form.customerId) {
      showMessage('Selecciona un cliente.');
      return;
    }

    if (editingId === null) {
      if (!form.productId) {
        showMessage('Selecciona al menos un producto.');
        return;
      }

      const quantity = Number(form.quantity);

      if (!Number.isInteger(quantity) || quantity < 1) {
        showMessage('La cantidad debe ser un número entero mayor que cero.');
        return;
      }

      if (form.fulfillmentMethod === 'delivery' && !form.deliveryAddress.trim()) {
        showMessage('Indica la dirección de entrega para el domicilio.');
        return;
      }
    }

    const body = editingId === null
      ? {
          customerId: form.customerId,
          fulfillmentMethod: form.fulfillmentMethod,
          ...(form.fulfillmentMethod === 'delivery'
            ? { deliveryAddress: form.deliveryAddress.trim() }
            : {}),
          details: [
            { productId: form.productId, quantity: Number(form.quantity) },
          ],
          ...(form.promotionalCodeId
            ? { promotionalCodeId: form.promotionalCodeId }
            : {}),
        }
      : {
          status: form.status,
          ...(form.promotionalCodeId
            ? { promotionalCodeId: form.promotionalCodeId }
            : {}),
        };

    const editing = editingId !== null;

    const response = await runApiAction({
      url: editing
        ? `${API.orders}/${editingId}`
        : API.orders,
      init: {
        method: editing ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
      },
      successMessage: editing
        ? 'Pedido actualizado exitosamente.'
        : 'Pedido creado exitosamente.',
      errorMessage: 'No se pudo guardar el pedido.',
    });

    if (!response) return;

    await loadOrders();
    closeModal();
  };

  const handleEdit = (order: Order) => {
    setForm({
      ...emptyForm,
      customerId: String(order.customerId ?? ''),
      total: String(order.total ?? ''),
      status: order.status ?? 'pending',
    });

    setEditingId(order.id);
    setDiscountCode('');
    setDiscountApplied(null);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const deleted = await runDeleteAction({
      url: `${API.orders}/${id}`,
      headers: authHeaders(),
      confirmMessage:
        '¿Eliminar este pedido? El historial se conservará.',
      successMessage: 'Pedido eliminado exitosamente.',
    });

    if (!deleted) return;

    setOrders((current) =>
      current.filter((order) => order.id !== id)
    );
  };

  const changeStatus = async (
    id: string,
    newStatus: string
  ) => {
    const response = await runApiAction({
      url: `${API.orders}/${id}`,
      init: {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      },
      successMessage:
        'Estado del pedido actualizado exitosamente.',
      errorMessage:
        'No se pudo actualizar el estado del pedido.',
    });

    if (!response) return;

    setOrders((current) =>
      current.map((order) =>
        order.id === id
          ? { ...order, status: newStatus }
          : order
      )
    );
  };

  const handleApplyDiscount = async (id: string) => {
    if (!discountCode.trim()) {
      showMessage('Ingresa un código de descuento.');
      notify.error('Ingresa un código de descuento.');
      return;
    }

    const response = await runApiAction({
      url: `${API.orders}/${id}/apply-code`,
      init: {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          code: discountCode.trim(),
        }),
      },
      successMessage:
        'Descuento aplicado exitosamente al pedido.',
      errorMessage: 'No se pudo aplicar el descuento.',
    });

    if (!response) return;

    const data = await response.json().catch(() => null);

    if (!data) {
      notify.error(
        'El servidor no devolvió los datos actualizados del pedido.'
      );
      return;
    }

    setForm((prev) => ({
      ...prev,
      total: String(data.total),
    }));

    setDiscountApplied(
      `Descuento aplicado. Nuevo total: $${Number(data.total).toLocaleString()}`
    );

    setDiscountCode('');
    await loadOrders();
  };

  return (
    <>
      <div className="pedidos-page">
        <div className="pedidos-topbar">
          <div className="pedidos-heading">
            <h2 className="titulo-pedidos">
              Gestión de pedidos
            </h2>
            <p className="subtitulo-pedidos">
              Administra los pedidos registrados
            </p>
          </div>
        </div>

        <div style={{ margin: '12px 0' }}>
          <Link className="btn-guardar-pedido" to="/empleado/nuevo">+ Crear pedido</Link>{' '}
          <Link className="btn-editar-pedido" to="/empleado/supervision">Supervisar pedidos operativos</Link>
        </div>
        {message && (
          <div className="mensaje-pedidos">
            {message}
          </div>
        )}

        {loading ? (
          <p
            style={{
              color: 'var(--text)',
              padding: '20px 0',
            }}
          >
            Cargando pedidos...
          </p>
        ) : (
          <table className="tabla-pedidos">
            <thead>
              <tr>
                <th>N° Pedido</th>
                <th>Cliente</th>
                <th>Descuento</th>
                <th>Total pedido</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {orders.length === 0 && (<tr><td colSpan={7} className="table-empty">Todavía no hay pedidos registrados.</td></tr>)}
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="numero-pedido">
                    PED-{shortReference(order.id)}
                  </td>

                  <td className="cliente-pedido">
                    {order.customer?.fullName ??
                      `Cliente #${shortReference(order.customerId)}`}
                  </td>

                  <td>
                    {order.promotionalCode
                      ? `${order.promotionalCode.code} (${order.promotionalCode.value})`
                      : '—'}
                  </td>

                  <td className="total-pedido">
                    ${Number(order.total).toLocaleString()}
                  </td>

                  <td>
                    {order.orderDate
                      ? order.orderDate.split('T')[0]
                      : '—'}
                  </td>

                  <td>
                    {order.createdById || order.work ? <span>{orderStatusLabel[order.status ?? ''] ?? order.status}</span> : <select
                      value={order.status ?? 'pending'}
                      onChange={(e) =>
                        changeStatus(order.id, e.target.value)
                      }
                      className={`estado-select-pedido ${statusTone[order.status ?? ''] ?? 'tone-neutral'}`}
                    >
                      <option
                        value="pending"
                      >
                        Pendiente
                      </option>

                      <option
                        value="shipped"
                      >
                        En camino
                      </option>

                      <option
                        value="delivered"
                      >
                        Entregado
                      </option>

                      <option
                        value="canceled"
                      >
                        Cancelado
                      </option>
                    </select>}
                  </td>

                  <td>
                    {order.createdById || order.work ? <Link className="btn-editar-pedido" to={`/empleado/supervision?pedido=${encodeURIComponent(order.id)}`}>Gestionar</Link> : <>
                    <button
                      className="btn-editar-pedido"
                      onClick={() => handleEdit(order)}
                    >
                      Editar
                    </button>

                    <button
                      className="btn-eliminar-pedido"
                      onClick={() => handleDelete(order.id)}
                    >
                      Eliminar
                    </button>
                    </>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <Modal
          titulo={
            editingId !== null
              ? 'Editar pedido'
              : 'Nuevo pedido'
          }
          onClose={closeModal}
          footer={
            <>
              <button
                className="btn-cancelar-pedido"
                onClick={closeModal}
              >
                Cancelar
              </button>

              <button
                className="btn-guardar-pedido"
                onClick={handleSave}
              >
                {editingId !== null
                  ? 'Guardar cambios'
                  : 'Agregar pedido'}
              </button>
            </>
          }
        >
          <label className="label-pedido">
            Cliente
          </label>

          <select
            className="input-pedido"
            name="customerId"
            value={form.customerId}
            onChange={handleChange}
            required
          >
            <option value="">
              Selecciona un cliente
            </option>

            {customers.map((customer) => (
              <option
                key={customer.id}
                value={customer.id}
              >
                {customer.fullName} — {customer.email}
              </option>
            ))}
          </select>

          {customers.length === 0 && (
            <p className="mensaje-pedidos">
              No hay clientes registrados. Crea primero
              un usuario con rol cliente.
            </p>
          )}

          {editingId === null && (
            <>
              <label className="label-pedido">
                Modalidad
              </label>

              <select
                className="input-pedido"
                name="fulfillmentMethod"
                value={form.fulfillmentMethod}
                onChange={handleChange}
              >
                <option value="delivery">Domicilio</option>
                <option value="pickup">Retiro en tienda</option>
              </select>

              {form.fulfillmentMethod === 'delivery' && (
                <>
                  <label className="label-pedido">
                    Dirección de entrega
                  </label>

                  <input
                    className="input-pedido"
                    type="text"
                    name="deliveryAddress"
                    value={form.deliveryAddress}
                    onChange={handleChange}
                    placeholder="Calle 45 #12-30, Bogotá"
                    maxLength={500}
                  />
                </>
              )}

              <label className="label-pedido">
                Producto
              </label>

              <select
                className="input-pedido"
                name="productId"
                value={form.productId}
                onChange={handleChange}
              >
                <option value="">Selecciona un producto</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} — ${Number(product.price ?? 0).toLocaleString()} (stock {product.stock ?? 0})
                  </option>
                ))}
              </select>

              <label className="label-pedido">
                Cantidad
              </label>

              <input
                className="input-pedido"
                type="number"
                min={1}
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
              />

              <p className="mensaje-pedidos">
                El total y el envío los calcula el servidor con el precio del
                catálogo; no se envían desde el navegador.
              </p>
            </>
          )}

          {editingId !== null && (
            <>
              <label className="label-pedido">
                Estado
              </label>

          <select
            className="input-pedido"
            name="status"
            value={form.status}
            onChange={handleChange}
          >
            <option value="pending">
              Pendiente
            </option>
            <option value="shipped">
              En camino
            </option>
            <option value="delivered">
              Entregado
            </option>
            <option value="canceled">
              Cancelado
            </option>
          </select>
            </>
          )}

          {editingId !== null && (
            <div style={{ marginTop: 16 }}>
              <label className="label-pedido">
                Código de descuento
              </label>

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                }}
              >
                <input
                  className="input-pedido"
                  placeholder="Ej: REGRESO10"
                  maxLength={50}
                  value={discountCode}
                  onChange={(e) =>
                    setDiscountCode(e.target.value)
                  }
                  style={{ marginBottom: 0 }}
                />

                <button
                  className="btn-guardar-pedido"
                  onClick={() =>
                    handleApplyDiscount(editingId)
                  }
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Aplicar
                </button>
              </div>

              {discountApplied && (
                <p
                  style={{
                    color: '#27ae60',
                    fontWeight: 600,
                    fontSize: 13,
                    marginTop: 8,
                  }}
                >
                  {discountApplied}
                </p>
              )}
            </div>
          )}
        </Modal>
      )}
    </>
  );
}