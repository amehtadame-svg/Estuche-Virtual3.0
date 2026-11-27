import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { shortReference } from '../../../lib/reference';
import { orderStatusLabel } from '../../../lib/statusLabels';
import Modal from '../../../components/ui/Modal';
import { API, BASE, authHeaders } from '../../../api/api';
import { notify, requestConfirmation } from '../../../lib/notifications';
import { useAuth } from '../../../hooks/useAuth';
import '../../../components/ui/ToastProvider.css';
import './Orders.css';

const statusTone: Record<string, string> = {
  pending: 'tone-info',
  shipped: 'tone-warning',
  delivered: 'tone-success',
  canceled: 'tone-danger',
};

const orderStatusText: Record<string, string> = {
  pending: 'pendiente',
  paid: 'pagado',
  preparing: 'en preparación',
  shipped: 'en camino',
  delivered: 'entregado',
  canceled: 'cancelado',
  returned: 'devuelto',
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
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [claimOrder, setClaimOrder] = useState<{ id: string; fromForm: boolean; action: 'claim' | 'undo' } | null>(null);
  const [claiming, setClaiming] = useState(false);
  const claimingRef = useRef(false);
  const [saveErrorNotice, setSaveErrorNotice] = useState<{ title: string; message: string } | null>(null);
  const savingRef = useRef(false);
  const discountRef = useRef(false);
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const showArchivedRef = useRef(false);
  const archiveRequests = useRef(new Set<string>());
  const listRequest = useRef(0);
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState<string | null>(null);
  const editingOrder = editingId === null
    ? undefined
    : orders.find((order) => order.id === editingId);
  const isPaidOrder = editingOrder?.status === 'paid';

  const loadOrders = (archived = showArchived) => {
    const request = ++listRequest.current;
    setLoading(true);
    fetch(`${API.orders}?archived=${archived ? 'true' : 'false'}`, { headers: authHeaders() })
      .then(async (response) => {
        if (!response.ok) throw new Error('No se pudo cargar la lista.');
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('Respuesta inválida.');
        if (request === listRequest.current) setOrders(data);
      })
      .catch(() => {
        if (request === listRequest.current) {
          setOrders([]);
          showMessage('No se pudo cargar la lista de pedidos.');
        }
      })
      .finally(() => {
        if (request === listRequest.current) setLoading(false);
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

  const showSaveError = (text: string, title = 'No se guardaron los cambios') => {
    if (user?.role === 'superadmin' || user?.role === 'admin') {
      setSaveErrorNotice({ title, message: text });
    } else {
      notify.error(text, title);
    }
  };

  const isOrderRestriction = (status: number, message: string) => {
    const text = message.toLowerCase();
    return (status === 400 || status === 409) && (
      text.includes('pedido operativo') ||
      text.includes('este pedido está pagado') ||
      text.includes('estado pagado solo puede establecerse')
    );
  };

  const showEditRejection = (status: number, message: string, total: number) => {
    if (!editingOrder || !isOrderRestriction(status, message)) {
      showSaveError(message);
      return;
    }

    const changes = [
      form.customerId !== (editingOrder.customerId ?? '') ? 'cliente' : null,
      editingOrder.total !== null && total !== Number(editingOrder.total) ? 'total' : null,
      form.status !== (editingOrder.status ?? 'pending') ? 'estado' : null,
    ].filter((field): field is string => field !== null);
    const state = orderStatusText[editingOrder.status ?? ''] ?? 'en un estado que requiere revisión';

    if (changes.length === 1 && changes[0] === 'total') {
      showSaveError(
        `El pedido figura ${state}. El servidor no permitió cambiar su total desde este formulario; revisa si tiene recibos o pagos asociados. No se modificó el total.`,
        'No se actualizó el total'
      );
    } else if (changes.length === 1 && changes[0] === 'cliente') {
      showSaveError(
        `El pedido figura ${state}. El servidor no permitió cambiar el cliente desde este formulario; revisa si tiene pagos asociados. No se modificó el cliente.`,
        'No se actualizó el cliente'
      );
    } else if (changes.length === 1 && changes[0] === 'estado') {
      showSaveError(
        `El pedido figura ${state}. El servidor no permitió cambiar su estado desde este formulario. No se modificó el estado.`,
        'No se actualizó el estado'
      );
    } else if (changes.length > 0) {
      showSaveError(
        `El pedido figura ${state}. El servidor rechazó los cambios solicitados; revisa el pedido y si tiene pagos asociados. No se modificaron los datos.`
      );
    } else {
      showSaveError('El servidor no confirmó el pedido. Cierra el formulario y vuelve a abrirlo para consultar su estado.');
    }
  };

  const statusGuidance = (current: string, requested: string) => {
    if (requested === 'pending' && current === 'preparing') return 'El pedido tiene una preparación activa. Si deseas deshacerla sin alterar el pago, selecciona Pagado y confirma la acción.';
    if (requested === 'paid') return 'El estado Pagado se actualiza cuando se confirma el pago en Pagos.';
    if (requested === 'delivered' && current === 'shipped') return 'Confirma la entrega real desde Operaciones, en el detalle del pedido y su envío.';
    if (requested === 'shipped') return 'El despacho se registra desde Operaciones después de preparar y empacar el pedido.';
    if (requested === 'canceled') return 'La cancelación se gestiona desde Operaciones, donde se revisan el pago y la reserva de inventario.';
    if (requested === 'returned') return 'La devolución requiere su proceso correspondiente y revisión de pagos.';
    return 'Este cambio requiere revisión en Operaciones para mantener el historial, los pagos y el inventario coherentes.';
  };

  const requestStatusChange = (order: Order, newStatus: string, fromForm: boolean) => {
    if ((order.status === 'paid' && newStatus === 'preparing') || (order.status === 'preparing' && newStatus === 'paid')) {
      if (fromForm) setModalOpen(false);
      setClaimOrder({ id: order.id, fromForm, action: newStatus === 'preparing' ? 'claim' : 'undo' });
      return;
    }
    showSaveError(statusGuidance(order.status ?? 'pending', newStatus), 'Cómo cambiar el estado');
  };

  const closeClaim = () => {
    if (claimingRef.current) return;
    if (claimOrder?.fromForm) setModalOpen(true);
    setClaimOrder(null);
  };

  const confirmClaim = async () => {
    if (!claimOrder || claimingRef.current) return;
    claimingRef.current = true;
    setClaiming(true);
    try {
      const response = await fetch(`${BASE}/api/employee/orders/${claimOrder.id}/${claimOrder.action === 'claim' ? 'claim' : 'undo-preparation'}`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify({}),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        showSaveError(data?.message || 'No se pudo cambiar la preparación. Revisa el pedido en Operaciones.', 'No se actualizó el estado');
        return;
      }
      setClaimOrder(null);
      if (claimOrder.fromForm) closeModal();
      notify.success(claimOrder.action === 'claim' ? 'El pedido quedó asignado a tu cuenta para su preparación.' : 'La preparación se deshizo y el pedido volvió a Pagado. El pago no cambió.', 'Cambios guardados');
      loadOrders();
    } catch {
      showSaveError('No se pudo confirmar la operación. Revisa el pedido en Operaciones antes de intentarlo de nuevo.', 'No se pudo confirmar el estado');
    } finally {
      claimingRef.current = false;
      setClaiming(false);
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
      const otherChanges = form.customerId !== (editingOrder.customerId ?? '') || form.status !== editingOrder.status;
      showSaveError(
        newTotal > Number(editingOrder.total)
          ? 'El pedido figura pagado. Aumentar el total puede requerir un cobro adicional. Esta acción no realizó cobros ni guardó los cambios.'
          : 'El pedido figura pagado. Reducir el total puede requerir una devolución. Esta acción no realizó reembolsos ni guardó los cambios.',
        otherChanges ? 'No se guardaron los cambios' : 'No se actualizó el total'
      );
      return;
    }

    if (editingOrder && form.status !== (editingOrder.status ?? 'pending')) {
      const otherChanges = form.customerId !== (editingOrder.customerId ?? '') ||
        editingOrder.total === null || newTotal !== Number(editingOrder.total) || !!form.promotionalCodeId;
      if (otherChanges) {
        showSaveError('Para cambiar el estado, primero deja los demás datos sin cambios. Ningún cambio fue guardado.', 'No se guardaron los cambios');
      } else {
        requestStatusChange(editingOrder, form.status, true);
      }
      return;
    }
    if (!editingOrder && form.status !== 'pending') {
      showSaveError('Los pedidos nuevos deben quedar pendientes. El pago y la preparación se registran después.', 'No se creó el pedido');
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
        const errorMessage = typeof result?.message === 'string' && result.message.trim()
          ? result.message
          : 'No se pudo guardar el pedido.';
        showEditRejection(response.status, errorMessage, newTotal);
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

  const handleArchive = async (id: string, archive: boolean) => {
    if (archiveRequests.current.has(id)) return;
    archiveRequests.current.add(id);
    try {
      if (archive && !(await requestConfirmation(
        '¿Quitar este pedido de la lista? Podrás restaurarlo. No se cancela ni se borran sus pagos o historial.'
      ))) return;
      const response = await fetch(`${API.orders}/${id}/${archive ? 'archive' : 'unarchive'}`, {
        method: 'POST', headers: authHeaders(),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        showSaveError(typeof data?.message === 'string' ? data.message : 'No se pudo actualizar la lista.', archive ? 'No se quitó el pedido' : 'No se restauró el pedido');
        return;
      }
      if (data?.archived !== archive) {
        showSaveError('No se pudo confirmar el resultado. Revisa la lista antes de intentarlo nuevamente.', 'No se pudo confirmar');
        loadOrders(showArchivedRef.current);
        return;
      }
      loadOrders(showArchivedRef.current);
      notify.success(archive
        ? 'Se quitó de esta lista. El pedido continúa y conserva sus pagos e historial.'
        : 'El pedido volvió a la lista administrativa.',
        archive ? 'Pedido archivado' : 'Pedido restaurado');
    } catch {
      showSaveError('No se pudo confirmar la operación. Actualiza la lista antes de intentarlo nuevamente.', 'No se pudo confirmar');
    } finally {
      archiveRequests.current.delete(id);
    }
  };

  const changeStatus = (id: string, newStatus: string) => {
    const order = orders.find((item) => item.id === id);
    if (order && newStatus !== order.status) requestStatusChange(order, newStatus, false);
  };

  const handleApplyDiscount = async (id: string) => {
    if (!discountCode.trim()) {
      showMessage('Ingresa un código de descuento.');
      notify.error('Ingresa un código de descuento.');
      return;
    }

    if (discountRef.current) return;
    discountRef.current = true;
    setApplyingDiscount(true);
    try {
      const response = await fetch(`${API.orders}/${id}/apply-code`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ code: discountCode.trim() }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        notify.error(typeof data?.message === 'string' ? data.message : 'No se pudo aplicar el código.');
        return;
      }
      if (!data || data.id !== id || !data.promotionalCode || data.total == null || !Number.isFinite(Number(data.total))) {
        notify.error('El servidor respondió, pero no se pudieron confirmar los datos. Actualiza el pedido antes de volver a intentarlo.');
        loadOrders(showArchivedRef.current);
        return;
      }
      setForm((prev) => ({ ...prev, total: String(data.total) }));
      setDiscountApplied(`Código asociado. Total informado por el servidor: $${Number(data.total).toLocaleString()}`);
      setDiscountCode('');
      notify.success('El servidor confirmó el código asociado al pedido. Revisa el total informado.', 'Código registrado');
      loadOrders(showArchivedRef.current);
    } catch {
      notify.error('No se pudo confirmar la operación. Actualiza el pedido antes de volver a intentarlo.');
    } finally {
      discountRef.current = false;
      setApplyingDiscount(false);
    }
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
          <button className="btn-editar-pedido" onClick={() => {
            const next = !showArchived;
            showArchivedRef.current = next;
            setShowArchived(next);
            loadOrders(next);
          }}>
            {showArchived ? 'Ver pedidos' : 'Ver archivados'}
          </button>
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
              {orders.length === 0 && (<tr><td colSpan={7} className="table-empty">{showArchived ? 'No hay pedidos archivados.' : 'No hay pedidos en esta lista.'}</td></tr>)}
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
                      disabled={showArchived}
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

                      <option value="paid" disabled={order.status !== 'paid' && order.status !== 'preparing'}>Pagado</option>
                      <option value="preparing" disabled={order.status !== 'paid' && order.status !== 'preparing'}>En preparación</option>
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
                    </select>}
                  </td>

                  <td>
                    {showArchived ? (
                      <button className="btn-editar-pedido" onClick={() => handleArchive(order.id, false)}>Restaurar</button>
                    ) : (
                      <>
                        {order.createdById || order.work ? (
                          <Link className="btn-editar-pedido" to={`/empleado/supervision?pedido=${encodeURIComponent(order.id)}`}>Gestionar</Link>
                        ) : (
                          <button className="btn-editar-pedido" onClick={() => handleEdit(order)}>Editar</button>
                        )}
                        <button className="btn-eliminar-pedido" onClick={() => handleArchive(order.id, true)}>Eliminar</button>
                      </>
                    )}
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
            <option value="paid" disabled={editingOrder?.status !== 'paid' && editingOrder?.status !== 'preparing'}>Pagado</option>
            <option value="preparing" disabled={!isPaidOrder && form.status !== 'preparing'}>En preparación</option>
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
                  disabled={applyingDiscount}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {applyingDiscount ? 'Aplicando...' : 'Aplicar'}
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

      {claimOrder && (
        <Modal
          titulo={claimOrder.action === 'claim' ? 'Iniciar preparación' : 'Deshacer preparación'}
          onClose={closeClaim}
          footer={
            <>
              <button className="btn-cancelar-pedido" onClick={closeClaim} disabled={claiming}>Cancelar</button>
              <button className="btn-guardar-pedido" onClick={confirmClaim} disabled={claiming}>
                {claiming ? 'Confirmando...' : claimOrder.action === 'claim' ? 'Iniciar preparación' : 'Deshacer preparación'}
              </button>
            </>
          }
        >
          <p>{claimOrder.action === 'claim'
            ? 'El pedido se asignará a tu cuenta y pasará a preparación si el pago y los productos cumplen las validaciones. Continúa solo si vas a gestionarlo.'
            : 'El pedido volverá a Pagado y quedará sin responsable. El pago y la reserva no se modificarán. Solo se permitirá si la recogida aún no ha comenzado y no hay envío.'}</p>
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
              <h2>{saveErrorNotice.title}</h2>
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
              <p className="success-notice-message">{saveErrorNotice.message}</p>
            </div>
          </section>
        </div>
      )}
    </>
  );
}