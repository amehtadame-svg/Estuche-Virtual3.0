import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import { API, authHeaders } from '../../../api/api';
import { runApiAction } from '../../../lib/apiAction';
import './Receipt.css';

const statusTone: Record<string, string> = {
  pending: 'tone-warning',
  paid: 'tone-success',
  partial: 'tone-info',
  overdue: 'tone-danger',
  voided: 'tone-neutral',
};

const emptyForm = {
  customerId: '',
  date: '',
  total: '',
  paymentStatus: 'pending',
};

interface Receipt {
  id: string;
  receiptNumber: number;
  customerId: string | null;
  date: string | null;
  total: number | null;
  paymentStatus: string | null;
  employee: { fullName: string } | null;
  order: { id: string; total: number } | null;
}

export default function Receipt() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadReceipts = () => {
    fetch(API.receipts, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        setReceipts(data);
        setLoading(false);
      })
      .catch(() => {
        showMessage('Error al cargar recibos.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadReceipts();
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
    if (!form.customerId || !form.total) {
      showMessage('Por favor completa todos los campos.');
      return;
    }

    const body = {
      customerId: form.customerId,
      total: Number(form.total),
      paymentStatus: form.paymentStatus,
    };

    const response = await runApiAction({
      url: editingId
        ? `${API.receipts}/${editingId}`
        : API.receipts,
      init: {
        method: editingId ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
      },
      successMessage: editingId
        ? 'Recibo actualizado.'
        : 'Recibo agregado.',
      errorMessage: 'No se pudo guardar el recibo.',
    });

    if (!response) return;

    loadReceipts();
    closeModal();
  };

  const handleEdit = (receipt: Receipt) => {
    setForm({
      customerId: String(receipt.customerId ?? ''),
      date: receipt.date
        ? receipt.date.split('T')[0]
        : '',
      total: String(receipt.total ?? ''),
      paymentStatus: receipt.paymentStatus ?? 'pending',
    });

    setEditingId(receipt.id);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await fetch(`${API.receipts}/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });

    setReceipts(
      receipts.filter((receipt) => receipt.id !== id)
    );

    showMessage('Recibo eliminado.');
  };

  const changeStatus = async (
    id: string,
    newStatus: string
  ) => {
    const res = await fetch(`${API.receipts}/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({
        paymentStatus: newStatus,
      }),
    });

    if (res.ok) {
      setReceipts(
        receipts.map((receipt) =>
          receipt.id === id
            ? { ...receipt, paymentStatus: newStatus }
            : receipt
        )
      );

      showMessage('Estado actualizado.');
    } else {
      showMessage('Error al actualizar el estado.');
    }
  };

  return (
    <>
      <div className="facturas-page">
        <div className="facturas-topbar">
          <div>
            <h2 className="titulo-facturas">
              Gestión de recibos
            </h2>

            <p className="subtitulo-usuarios">
              Administra los recibos registrados
            </p>
          </div>

          <button
            className="btn-nuevo-factura"
            onClick={openNewModal}
          >
            + Nuevo recibo
          </button>
        </div>

        {message && (
          <div className="mensaje-facturas">
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
            Cargando recibos...
          </p>
        ) : (
          <table className="tabla-facturas">
            <thead>
              <tr>
                <th>N° Recibo</th>
                <th>Pedido</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Empleado</th>
                <th>Pago</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {receipts.length === 0 && (
                <tr>
                  <td colSpan={7} className="table-empty">
                    Todavía no hay recibos registrados.
                  </td>
                </tr>
              )}
              {receipts.map((receipt) => (
                <tr key={receipt.id}>
                  <td className="numero-factura">
                    REC-
                    {String(receipt.receiptNumber).padStart(3, '0')}
                  </td>

                  <td>
                    {receipt.order
                      ? `PED-${receipt.order.id.slice(-6).toUpperCase()}`
                      : '—'}
                  </td>

                  <td>
                    {receipt.date
                      ? receipt.date.split('T')[0]
                      : '—'}
                  </td>

                  <td className="total-factura">
                    ${Number(receipt.total).toLocaleString()}
                  </td>

                  <td>
                    {receipt.employee?.fullName ?? '—'}
                  </td>

                  <td>
                    <select
                      disabled
                      title="El estado financiero se actualizará desde el flujo de pagos."
                      value={receipt.paymentStatus ?? 'pending'}
                      onChange={(e) =>
                        changeStatus(
                          receipt.id,
                          e.target.value
                        )
                      }
                      className={`estado-select-factura ${statusTone[
                            receipt.paymentStatus ?? ''
                          ] ?? 'tone-neutral'}`}
                    >
                      <option
                        value="pending"
                      >
                        Pendiente
                      </option>

                      <option
                        value="paid"
                      >
                        Pagada
                      </option>

                      <option
                        value="partial"
                      >
                        Parcial
                      </option>

                      <option
                        value="overdue"
                      >
                        Vencida
                      </option>

                      <option
                        value="voided"
                      >
                        Anulada
                      </option>
                    </select>
                  </td>

                  <td>
                    <button
                      className="btn-editar-factura"
                      onClick={() => handleEdit(receipt)}
                    >
                      Editar
                    </button>

                    <button
                      disabled
                      title="La eliminación está deshabilitada para conservar el historial."
                      className="btn-eliminar-factura"
                      onClick={() =>
                        handleDelete(receipt.id)
                      }
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
              ? 'Editar recibo'
              : 'Nuevo recibo'
          }
          onClose={closeModal}
          footer={
            <>
              <button
                className="btn-cancelar-factura"
                onClick={closeModal}
              >
                Cancelar
              </button>

              <button
                className="btn-guardar-factura"
                onClick={handleSave}
              >
                {editingId !== null
                  ? 'Guardar cambios'
                  : 'Agregar recibo'}
              </button>
            </>
          }
        >
          <label className="label-factura">
            ID Cliente
          </label>

          <input
            className="input-factura"
            name="customerId"
            value={form.customerId}
            onChange={handleChange}
            placeholder="UUID del cliente"
          />

          <label className="label-factura">
            Fecha
          </label>

          <input
            className="input-factura"
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
          />

          <label className="label-factura">
            Total
          </label>

          <input
            className="input-factura"
            type="number"
            name="total"
            value={form.total}
            onChange={handleChange}
            placeholder="85000"
          />

          <label className="label-factura">
            Estado
          </label>

          <select
            disabled
            className="input-factura"
            name="paymentStatus"
            value={form.paymentStatus}
            onChange={handleChange}
          >
            <option value="pending">
              Pendiente
            </option>
            <option value="paid">
              Pagada
            </option>
            <option value="partial">
              Parcial
            </option>
            <option value="overdue">
              Vencida
            </option>
            <option value="voided">
              Anulada
            </option>
          </select>
        </Modal>
      )}
    </>
  );
}