import { useState, useEffect, useRef, useCallback } from 'react';
import { z } from 'zod';
import ReferenceSelect from '../../../components/ui/ReferenceSelect';
import { shortReference } from '../../../lib/reference';
import Modal from '../../../components/ui/Modal';
import { API, authHeaders } from '../../../api/api';
import { runApiAction } from '../../../lib/apiAction';
import { notify, requestConfirmation } from '../../../lib/notifications';
import './Receipt.css';

const statusTone: Record<string, string> = {
  pending: 'tone-warning',
  paid: 'tone-success',
  partial: 'tone-info',
  overdue: 'tone-danger',
  voided: 'tone-neutral',
};

const ARCHIVE_KEY = 'estuche:recibos-archivados';

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
  const [formError, setFormError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [archivedView, setArchivedView] = useState(false);
  const [archiveBusy, setArchiveBusy] = useState(false);
  const archiveBusyRef = useRef(false);
  const loadVersion = useRef(0);
  const [archivedIds, setArchivedIds] = useState<string[]>([]);
  const [archiveAvailable, setArchiveAvailable] = useState(false);

  const loadReceipts = useCallback(async () => {
    const version = ++loadVersion.current;
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(API.receipts, { headers: authHeaders() });
      if (!response.ok) throw new Error('load');
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('format');
      if (version === loadVersion.current) setReceipts(data);
    } catch {
      if (version === loadVersion.current) {
        setReceipts([]);
        setMessage('No se pudieron cargar los recibos. Revisa la conexión e inténtalo de nuevo.');
      }
    } finally {
      if (version === loadVersion.current) setLoading(false);
    }
  }, []);

  const readArchive = useCallback((): string[] => {
    const stored = localStorage.getItem(ARCHIVE_KEY);
    if (stored === null) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed) || !parsed.every((id) => typeof id === 'string')) {
      throw new Error('invalid archive');
    }
    return parsed;
  }, []);

  useEffect(() => {
    loadReceipts();
    return () => { loadVersion.current++; };
  }, [loadReceipts]);

  useEffect(() => {
    const syncArchive = () => {
      try {
        setArchivedIds(readArchive());
        setArchiveAvailable(true);
      } catch {
        setArchiveAvailable(false);
        setMessage('No se pudo leer el archivo de este navegador. Los recibos no se han eliminado.');
      }
    };
    syncArchive();
    const onStorage = (event: StorageEvent) => {
      if (event.key === ARCHIVE_KEY || event.key === null) syncArchive();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [readArchive]);

  const handleArchive = async (receipt: Receipt, archive: boolean) => {
    if (archiveBusyRef.current || !archiveAvailable) return;
    archiveBusyRef.current = true;
    setArchiveBusy(true);
    setMessage('');
    try {
      if (archive && !(await requestConfirmation('¿Deseas archivar este recibo en este navegador? El recibo y sus pagos se conservan.'))) return;
      const current = readArchive();
      const updated = archive
        ? Array.from(new Set([...current, receipt.id]))
        : current.filter((id) => id !== receipt.id);
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(updated));
      const confirmed = readArchive();
      if (confirmed.includes(receipt.id) !== archive) throw new Error('not persisted');
      setArchivedIds(confirmed);
      notify.success(
        archive ? 'El recibo se archivó solo en este navegador. Sus datos y pagos se conservan.'
          : 'El recibo volvió a la lista de este navegador.',
        archive ? 'Recibo archivado' : 'Recibo restaurado',
      );
    } catch {
      setMessage('No se pudo guardar el archivo en este navegador. Revisa la lista antes de intentarlo de nuevo.');
    } finally {
      archiveBusyRef.current = false;
      setArchiveBusy(false);
    }
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
    setFormError('');
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (savingRef.current) return;
    setFormError('');
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!form.customerId || !form.total) {
      setFormError('Completa los campos obligatorios antes de guardar.');
      return;
    }

    const customerId = form.customerId.trim();
    if (!z.guid().safeParse(customerId).success) {
      setFormError('Selecciona un cliente válido de la lista.');
      return;
    }
    const total = Number(form.total);
    if (!Number.isFinite(total) || total < 0) {
      setFormError('Ingresa un total válido, mayor o igual a cero.');
      return;
    }

    setFormError('');
    const body = {
      customerId,
      total,
      paymentStatus: form.paymentStatus,
    };

    const receiptEditing = receipts.find((receipt) => receipt.id === editingId);
    if (editingId && !receiptEditing) {
      setFormError('No se encontró el recibo en la lista. Ciérralo y actualiza antes de continuar.');
      return;
    }
    if (receiptEditing && customerId === (receiptEditing.customerId ?? '') && total === Number(receiptEditing.total)) {
      setFormError('No hay cambios para guardar.');
      return;
    }

    savingRef.current = true;
    setSaving(true);
    let saved = false;
    try {
      const response = await fetch(editingId ? `${API.receipts}/${editingId}` : API.receipts, {
        method: editingId ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const serverMessage = typeof payload?.message === 'string' ? payload.message : '';
        setFormError(serverMessage || 'No se pudo guardar el recibo. Inténtalo de nuevo.');
        return;
      }
      const data = await response.json().catch(() => null);
      if (!data?.id || (editingId && data.id !== editingId) || data.customerId !== customerId ||
          data.total == null || !Number.isFinite(Number(data.total)) || Number(data.total) !== total ||
          (!editingId && data.paymentStatus !== 'pending')) {
        setFormError('El servidor respondió, pero los datos no coinciden con lo solicitado. Cierra el formulario y revisa el recibo antes de intentar de nuevo.');
        return;
      }
      saved = true;
      notify.success(editingId ? 'El recibo se guardó correctamente.' : 'El recibo se registró correctamente.',
        editingId ? 'Cambios guardados' : 'Recibo registrado');
    } catch {
      setFormError('No se pudo confirmar el guardado. Revisa el recibo antes de intentarlo de nuevo.');
    } finally {
      savingRef.current = false;
      setSaving(false);
      if (saved) {
        loadReceipts();
        closeModal();
      }
    }
  };

  const handleEdit = (receipt: Receipt) => {
    setFormError('');
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

  const changeStatus = async (id: string, newStatus: string) => {
    const response = await runApiAction({
      url: `${API.receipts}/${id}`,
      init: { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ paymentStatus: newStatus }) },
      successMessage: 'El estado del recibo se actualizó correctamente.',
      errorMessage: 'No se pudo actualizar el estado del recibo.',
    });
    if (response) setReceipts((current) => current.map((receipt) => receipt.id === id ? { ...receipt, paymentStatus: newStatus } : receipt));
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

        <div className="recibo-vistas">
          <button type="button" className="recibo-vistas-boton" disabled={archiveBusy || !archiveAvailable}
            onClick={() => setArchivedView((current) => !current)}>
            {archivedView ? 'Ver recibos activos' : 'Ver archivados'}
          </button>
        </div>
        <p className="recibo-vista-ayuda">El archivo solo se guarda en este navegador; no elimina recibos ni pagos.</p>
        {message && <div className="recibo-aviso" role="alert"><span className="recibo-aviso-icono" aria-hidden="true">!</span><div><strong>No se pudo completar</strong><p>{message}</p></div></div>}

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
              {receipts.filter((receipt) => archivedIds.includes(receipt.id) === archivedView).length === 0 && (
                <tr>
                  <td colSpan={7} className="table-empty">
                    {archivedView ? 'No hay recibos archivados.' : 'Todavía no hay recibos en esta lista.'}
                  </td>
                </tr>
              )}
              {receipts.filter((receipt) => archivedIds.includes(receipt.id) === archivedView).map((receipt) => (
                <tr key={receipt.id}>
                  <td className="numero-factura">
                    REC-
                    {String(receipt.receiptNumber).padStart(3, '0')}
                  </td>

                  <td>
                    {receipt.order
                      ? `PED-${shortReference(receipt.order.id)}`
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
                    <div className="recibo-acciones">
                      {!archivedView && <button className="btn-editar-factura" onClick={() => handleEdit(receipt)} disabled={archiveBusy}>Editar</button>}
                      <button className="btn-eliminar-factura" disabled={archiveBusy || !archiveAvailable}
                        onClick={() => handleArchive(receipt, !archivedView)}>
                        {archivedView ? 'Restaurar' : 'Archivar'}
                      </button>
                    </div>
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
                disabled={saving}
                onClick={closeModal}
              >
                Cancelar
              </button>

              <button
                className="btn-guardar-factura"
                disabled={saving || (!!editingId && (form.paymentStatus !== 'pending' || !!receipts.find((r) => r.id === editingId)?.order))}
                onClick={handleSave}
              >
                {saving ? 'Guardando...' : editingId !== null
                  ? 'Guardar cambios'
                  : 'Agregar recibo'}
              </button>
            </>
          }
        >
          {formError && (
            <div className="recibo-aviso" role="alert">
              <span className="recibo-aviso-icono" aria-hidden="true">!</span>
              <div><strong>No se pudo guardar</strong><p>{formError}</p></div>
            </div>
          )}
          {!formError && editingId && form.paymentStatus !== 'pending' && (
            <div className="recibo-aviso" role="status">
              <span className="recibo-aviso-icono" aria-hidden="true">i</span>
              <div><strong>Recibo con estado financiero avanzado</strong><p>Por seguridad, este recibo no se puede editar desde aquí.</p></div>
            </div>
          )}
          {!formError && editingId && form.paymentStatus === 'pending' && !!receipts.find((r) => r.id === editingId)?.order && (
            <div className="recibo-aviso" role="status">
              <span className="recibo-aviso-icono" aria-hidden="true">i</span>
              <div><strong>Recibo asociado a un pedido</strong><p>El cliente y el total corresponden al pedido y no se pueden cambiar desde aquí.</p></div>
            </div>
          )}
          <label className="label-factura">
            Cliente
          </label>

          <ReferenceSelect endpoint={API.users} kind="customer"
            className="input-factura"
            name="customerId"
            disabled={!!editingId && (form.paymentStatus !== 'pending' || !!receipts.find((r) => r.id === editingId)?.order)}
            value={form.customerId}
            onChange={handleChange}
          />

          <label className="label-factura">
            Fecha
          </label>

          <input
            className="input-factura"
            type="date"
            disabled
            name="date"
            value={form.date}
            onChange={handleChange}
          />

          <small className="recibo-ayuda">La fecha se registra automáticamente y no se puede cambiar desde este formulario.</small>

          <label className="label-factura">
            Total
          </label>

          <input
            className="input-factura"
            type="number"
            disabled={!!editingId && (form.paymentStatus !== 'pending' || !!receipts.find((r) => r.id === editingId)?.order)}
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
          <small className="recibo-ayuda">Los recibos nuevos se registran pendientes. El estado depende de los pagos registrados.</small>
        </Modal>
      )}
    </>
  );
}