import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import { API } from '../../../api/api';
import './Receipt.css';

const statusColor: Record<string, string> = {
  pending: '#f39c12',
  paid: '#27ae60',
  partial: '#3498db',
  overdue: '#e67e22',
  voided: '#e74c3c',
};

const emptyForm = { customerId: '', date: '', total: '', paymentStatus: 'pending' };

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
    fetch(API.receipts)
      .then((r) => r.json())
      .then((data) => {
        setReceipts(data);
        setLoading(false);
      })
      .catch(() => {
        showMessage('Error al cargar facturas.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadReceipts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (!form.customerId || !form.total) {
      showMessage('Por favor completa todos los campos.');
      return;
    }

    const body = {
      customerId: form.customerId,
      total: Number(form.total),
      paymentStatus: form.paymentStatus,
    };

    if (editingId !== null) {
      await fetch(`${API.receipts}/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      showMessage('Factura actualizada.');
    } else {
      await fetch(API.receipts, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      showMessage('Factura agregada.');
    }

    loadReceipts();
    closeModal();
  };

  const handleEdit = (f: Receipt) => {
    setForm({
      customerId: String(f.customerId ?? ''),
      date: f.date ? f.date.split('T')[0] : '',
      total: String(f.total ?? ''),
      paymentStatus: f.paymentStatus ?? 'pending',
    });
    setEditingId(f.id);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await fetch(`${API.receipts}/${id}`, { method: 'DELETE' });
    setReceipts(receipts.filter((f) => f.id !== id));
    showMessage('Factura eliminada.');
  };

  const changeStatus = async (id: string, newStatus: string) => {
    const res = await fetch(`${API.receipts}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus: newStatus }),
    });
    if (res.ok) {
      setReceipts(receipts.map((f) => (f.id === id ? { ...f, paymentStatus: newStatus } : f)));
      showMessage('Estado actualizado.');
    } else {
      showMessage('Error al actualizar el estado.');
    }
  };

  return (
    <>
      <div className="facturas-page">
        <div className="facturas-topbar">
          <h2 className="titulo-facturas">Gestion de Facturas</h2>
          <p className="subtitulo-usuarios">Administra las Facturas registradas</p>
          <button className="btn-nuevo-factura" onClick={openNewModal}>
            + Nueva factura
          </button>
        </div>

        {message && <div className="mensaje-facturas">{message}</div>}

        {loading ? (
          <p style={{ color: 'var(--text)', padding: '20px 0' }}>Cargando facturas...</p>
        ) : (
          <table className="tabla-facturas">
            <thead>
              <tr>
                <th>N° Factura</th>
                <th>Pedido</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Empleado</th>
                <th>Pago</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((fac) => (
                <tr key={fac.id}>
                  <td className="numero-factura">FAC-{String(fac.receiptNumber).padStart(3, '0')}</td>
                  <td>{fac.order ? `PED-${fac.order.id.slice(0, 6).toUpperCase()}` : '—'}</td>
                  <td>{fac.date ? fac.date.split('T')[0] : '—'}</td>
                  <td className="total-factura">${Number(fac.total).toLocaleString()}</td>
                  <td>{fac.employee?.fullName ?? '—'}</td>
                  <td>
                    <select
                      value={fac.paymentStatus ?? 'pending'}
                      onChange={(e) => changeStatus(fac.id, e.target.value)}
                      className="estado-select-factura"
                      style={{ backgroundColor: statusColor[fac.paymentStatus ?? ''] || '#999', color: '#fff' }}
                    >
                      <option value="pending" style={{ backgroundColor: '#fff', color: '#1E2761' }}>Pendiente</option>
                      <option value="paid" style={{ backgroundColor: '#fff', color: '#1E2761' }}>Pagada</option>
                      <option value="partial" style={{ backgroundColor: '#fff', color: '#1E2761' }}>Parcial</option>
                      <option value="overdue" style={{ backgroundColor: '#fff', color: '#1E2761' }}>Vencida</option>
                      <option value="voided" style={{ backgroundColor: '#fff', color: '#1E2761' }}>Anulada</option>
                    </select>
                  </td>
                  <td>
                    <button className="btn-editar-factura" onClick={() => handleEdit(fac)}>Editar</button>
                    <button className="btn-eliminar-factura" onClick={() => handleDelete(fac.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <Modal
          titulo={editingId !== null ? 'Editar factura' : 'Nueva factura'}
          onClose={closeModal}
          footer={
            <>
              <button className="btn-cancelar-factura" onClick={closeModal}>Cancelar</button>
              <button className="btn-guardar-factura" onClick={handleSave}>
                {editingId !== null ? 'Guardar cambios' : 'Agregar factura'}
              </button>
            </>
          }
        >
          <label className="label-factura">ID Cliente</label>
          <input className="input-factura" name="customerId" value={form.customerId} onChange={handleChange} placeholder="UUID del cliente" />

          <label className="label-factura">Fecha</label>
          <input className="input-factura" type="date" name="date" value={form.date} onChange={handleChange} />

          <label className="label-factura">Total</label>
          <input className="input-factura" type="number" name="total" value={form.total} onChange={handleChange} placeholder="85000" />

          <label className="label-factura">Estado</label>
          <select className="input-factura" name="paymentStatus" value={form.paymentStatus} onChange={handleChange}>
            <option value="pending">Pendiente</option>
            <option value="paid">Pagada</option>
            <option value="partial">Parcial</option>
            <option value="overdue">Vencida</option>
            <option value="voided">Anulada</option>
          </select>
        </Modal>
      )}
    </>
  );
}
