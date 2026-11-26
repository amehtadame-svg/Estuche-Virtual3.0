import { useState, useEffect, useRef } from 'react';
import Modal from '../../../components/ui/Modal';
import { API, authHeaders } from '../../../api/api';
import { runDeleteAction } from '../../../lib/deleteAction';
import { runApiAction } from '../../../lib/apiAction';
import { notify } from '../../../lib/notifications';
import { useAuth } from '../../../hooks/useAuth';
import '../../../components/ui/ToastProvider.css';
import './Orders.css';

const statusTone: Record<string, string> = {
  pending: 'tone-info',
  shipped: 'tone-warning',
  delivered: 'tone-success',
  canceled: 'tone-danger',
};

const emptyForm = {
  customerId: '',
  total: '',
  status: 'pending',
  promotionalCodeId: '',
};

interface Customer {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

interface Order {
  id: string;
  customerId: string | null;
  total: number | null;
  status: string | null;
  orderDate: string | null;
  customer: { fullName: string } | null;
  promotionalCode: { code: string; value: number } | null;
  driver: { fullName: string } | null;
}

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveErrorNotice, setSaveErrorNotice] = useState<string | null>(null);
  const savingRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState<string | null>(null);
  const editingOrder = editingId === null
    ? undefined
    : orders.find((order) => order.id === editingId);
  const isPaidOrder = editingOrder?.status === 'paid';

  const loadOrders = () => {
    fetch(API.orders, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        setOrders(data);
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

  useEffect(() => {
    loadOrders();
    loadCustomers();
  }, []);

  useEffect(() => {
    if (!saveErrorNotice) return;
    const timer = window.setTimeout(() => setSaveErrorNotice(null), 4200);
    return () => window.clearTimeout(timer);
  }, [saveErrorNotice]);

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

  const showSaveError = (text: string) => {
    if (user?.role === 'superadmin') {
      setSaveErrorNotice(text);
    } else {
      notify.error(text, 'No se guardaron los cambios');
    }
  };

  const handleSave = async () => {
    if (!form.customerId || !form.total) {
      showSaveError('Completa el cliente y el total antes de guardar.');
      return;
    }

    const newTotal = Number(form.total);
    if (!Number.isFinite(newTotal) || newTotal < 0) {
      showSaveError('El total debe ser un número válido mayor o igual a cero.');
      return;
    }

    if (isPaidOrder && editingOrder?.total != null && newTotal !== Number(editingOrder.total)) {
      showSaveError(
        newTotal > Number(editingOrder.total)
          ? 'El pedido ya está pagado. Aumentar el total puede requerir un cobro adicional. No se hizo ningún cobro ni se cambió el pedido.'
          : 'El pedido ya está pagado. Reducir el total puede requerir una devolución. No se hizo ningún reembolso ni se cambió el pedido.'
      );
      return;
    }

    const body = {
      customerId: form.customerId,
      total: newTotal,
      status: form.status,
      ...(form.promotionalCodeId
        ? { promotionalCodeId: form.promotionalCodeId }
        : {}),
    };

    const editing = editingId !== null;

    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);

    try {
      const response = await fetch(
        editing ? `${API.orders}/${editingId}` : API.orders,
        {
          method: editing ? 'PUT' : 'POST',
          headers: authHeaders(),
          body: JSON.stringify(body),
        }
      );
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        showSaveError(result?.message || 'No se pudo guardar el pedido.');
        return;
      }

      closeModal();
      if (editing && result?.sinCambios === true) {
        notify.success('El pedido está actualizado. No se realizaron cambios.', 'Pedido verificado');
      } else {
        notify.success(
          editing ? 'El pedido se actualizó exitosamente.' : 'El pedido se creó exitosamente.',
          editing ? 'Cambios guardados' : 'Registro exitoso'
        );
      }
      loadOrders();
    } catch {
      showSaveError('No se pudo confirmar la operación. Verifica el pedido antes de intentarlo de nuevo.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleEdit = (order: Order) => {
    setForm({
      customerId: String(order.customerId ?? ''),
      total: String(order.total ?? ''),
      status: order.status ?? 'pending',
      promotionalCodeId: '',
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
                    PED-{order.id.slice(-6).toUpperCase()}
                  </td>

                  <td className="cliente-pedido">
                    {order.customer?.fullName ??
                      `Cliente #${order.customerId?.slice(-6).toUpperCase() ?? '-'}`}
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
                    <select
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

                      <option value="paid" disabled>Pagado</option>
                      <option value="preparing" disabled>En preparación</option>
                      <option value="returned" disabled>Devuelto</option>

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
                    </select>
                  </td>

                  <td>
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
                disabled={saving}
              >
                {saving
                  ? 'Guardando...'
                  : editingId !== null
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

          <label className="label-pedido">
            Total
          </label>

          <input
            className="input-pedido"
            type="number"
            name="total"
            value={form.total}
            onChange={handleChange}
            placeholder="85000"
          />

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
            <option value="paid" disabled>Pagado</option>
            <option value="preparing" disabled>En preparación</option>
            <option value="returned" disabled>Devuelto</option>
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

      {saveErrorNotice && (
        <div className="success-notice-overlay notificaciones-superadmin">
          <section
            className="confirm-delete-dialog success-notice-dialog"
            role="alert"
            aria-live="assertive"
          >
            <header className="confirm-delete-header">
              <span className="success-notice-icon" aria-hidden="true">!</span>
              <h2>No se guardaron los cambios</h2>
              <button
                type="button"
                className="confirm-delete-close"
                aria-label="Cerrar notificación"
                onClick={() => setSaveErrorNotice(null)}
              >
                ×
              </button>
            </header>
            <div className="confirm-delete-body success-notice-body">
              <p className="success-notice-message">{saveErrorNotice}</p>
            </div>
          </section>
        </div>
      )}
    </>
  );
}