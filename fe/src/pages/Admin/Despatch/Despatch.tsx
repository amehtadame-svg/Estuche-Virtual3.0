import { useState, useEffect, useRef } from 'react';
import { z } from 'zod';
import Modal from '../../../components/ui/Modal';
import { API, authHeaders } from '../../../api/api';
import { notify, requestConfirmation } from '../../../lib/notifications';
import './Despatch.css';

const statusTone: Record<string, string> = {
  in_transit: 'tone-warning',
  delivered: 'tone-success',
  returned: 'tone-danger',
  canceled: 'tone-neutral',
};

const ARCHIVE_KEY = 'estuche:envios-archivados';

const emptyForm = {
  orderId: '',
  driverId: '',
  address: '',
  status: 'in_transit',
};

interface Driver {
  id: string;
  fullName: string;
}

interface Despatch {
  id: string;
  orderId: string;
  driverId: string | null;
  address: string | null;
  shipDate: string | null;
  deliveredAt: string | null;
  status: string;
  order: { id: string } | null;
  driver: { fullName: string } | null;
}

export default function Despatch() {
  const [despatches, setDespatches] = useState<Despatch[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const orderLookupRef = useRef(0);
  const [archivedView, setArchivedView] = useState(false);
  const [archivedIds, setArchivedIds] = useState<string[]>([]);
  const [archiveAvailable, setArchiveAvailable] = useState(false);
  const [archiveBusy, setArchiveBusy] = useState(false);
  const archiveBusyRef = useRef(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const statusBusyRef = useRef(false);

  const loadDespatches = () => {
    fetch(API.despatches, { headers: authHeaders() })
      .then((r) => { if (!r.ok) throw new Error('load'); return r.json(); })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('format');
        setDespatches(data);
        setLoading(false);
      })
      .catch(() => {
        showMessage('Error al cargar envíos.');
        setLoading(false);
      });
  };

  const loadDrivers = () => {
    fetch(API.users, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) =>
        setDrivers(
          data.filter(
            (user: { role: string }) =>
              user.role === 'delivery'
          )
        )
      )
      .catch(() => {});
  };

  useEffect(() => {
    loadDespatches();
    loadDrivers();
  }, []);

  const readArchive = (): string[] => {
    const stored = localStorage.getItem(ARCHIVE_KEY);
    if (stored === null) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed) || !parsed.every((id) => typeof id === 'string')) throw new Error('invalid archive');
    return parsed;
  };

  useEffect(() => {
    const syncArchive = () => {
      try { setArchivedIds(readArchive()); setArchiveAvailable(true); }
      catch { setArchiveAvailable(false); setMessage('No se pudo leer el archivo de este navegador. No se han eliminado envíos.'); }
    };
    syncArchive();
    const onStorage = (event: StorageEvent) => { if (event.key === ARCHIVE_KEY || event.key === null) syncArchive(); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
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

  const handleOrderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.target.value;
    const request = ++orderLookupRef.current;
    setForm((prev) => ({ ...prev, orderId: id, address: '' }));
    if (!z.string().uuid().safeParse(id.trim()).success) return;

    try {
      const res = await fetch(`${API.orders}/${id.trim()}`, { headers: authHeaders() });
      if (!res.ok) return;
      const order = await res.json();
      if (request !== orderLookupRef.current) return;
      setForm((prev) => prev.orderId === id && !prev.address
        ? { ...prev, address: order.deliveryAddress?.address ?? '' }
        : prev);
    } catch {
      // Si no se puede cargar, se conserva la dirección que escriba la persona.
    }
  };

  const openNewModal = () => {
    orderLookupRef.current += 1;
    setFormError('');
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (savingRef.current) return;
    orderLookupRef.current += 1;
    setFormError('');
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (savingRef.current) return;
    const orderId = form.orderId.trim();
    const address = form.address.trim();
    if (!orderId || !address) {
      setFormError('Completa el ID del pedido y la dirección antes de guardar.');
      return;
    }
    if (!editingId && !z.string().uuid().safeParse(orderId).success) {
      setFormError('El ID del pedido no es válido. Ingresa el identificador completo de un pedido registrado.');
      return;
    }
    if (address.length > 500) {
      setFormError('La dirección no puede superar los 500 caracteres.');
      return;
    }
    if (form.driverId && !z.string().uuid().safeParse(form.driverId).success) {
      setFormError('El repartidor seleccionado no tiene un identificador válido.');
      return;
    }

    const editing = editingId !== null;
    const existing = despatches.find((item) => item.id === editingId);
    const unchanged = !!existing && existing.address === address &&
      (existing.driverId ?? '') === form.driverId && existing.status === form.status;
    if (unchanged) {
      setFormError('No hay cambios para guardar.');
      return;
    }
    if (editing && !existing) {
      setFormError('El envío ya no está en la lista. Cierra el formulario y actualiza la página.');
      return;
    }
    const body = {
      ...(editing ? { expected: { address: existing!.address, driverId: existing!.driverId, status: existing!.status } } : { orderId }),
      driverId: form.driverId || null,
      address,
      status: form.status,
    };

    savingRef.current = true;
    setSaving(true);
    setFormError('');
    try {
      if (editing && form.status === 'delivered' && existing?.status !== 'delivered' &&
        !(await requestConfirmation('¿Confirmas que el envío ya fue entregado al cliente? Esta acción puede actualizar el estado del pedido.'))) return;
      const res = await fetch(editing ? `${API.despatches}/${editingId}` : API.despatches, {
        method: editing ? 'PUT' : 'POST', headers: authHeaders(), body: JSON.stringify(body),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok) {
        if (result?.message === 'Datos inválidos' && Array.isArray(result?.errors)) {
          const fields = result.errors.map((issue: { path?: (string | number)[] }) => String(issue.path?.[0] ?? ''));
          const problems = [
            fields.includes('orderId') ? 'Revisa el ID del pedido.' : '',
            fields.includes('driverId') ? 'Revisa el repartidor seleccionado.' : '',
            fields.includes('address') ? 'Revisa la dirección.' : '',
            fields.includes('status') ? 'Revisa el estado del envío.' : '',
          ].filter(Boolean).join(' ');
          setFormError(problems || 'Revisa los datos del envío e inténtalo de nuevo.');
        } else {
          setFormError(typeof result?.message === 'string' ? result.message : 'No se pudo guardar el envío.');
        }
        return;
      }
      if (!result || (editing && result.id !== editingId) || result.orderId !== orderId || result.address !== address ||
          (result.driverId ?? null) !== body.driverId || result.status !== form.status) {
        setFormError('El servidor respondió, pero no se pudo confirmar que los datos coincidan. Revisa el envío antes de volver a guardar.');
        loadDespatches();
        return;
      }
      savingRef.current = false;
      closeModal();
      loadDespatches();
      notify.success(
        editing ? 'El envío se actualizó correctamente.' : 'El envío se registró correctamente.',
        editing ? 'Cambios guardados' : 'Envío registrado',
      );
    } catch {
      setFormError('No se pudo confirmar el guardado. Revisa la lista de envíos antes de intentarlo de nuevo.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleEdit = (despatch: Despatch) => {
    orderLookupRef.current += 1;
    setFormError('');
    setForm({
      orderId: String(despatch.orderId ?? ''),
      driverId: String(despatch.driverId ?? ''),
      address: despatch.address ?? '',
      status: despatch.status ?? 'in_transit',
    });

    setEditingId(despatch.id);
    setModalOpen(true);
  };

  const handleArchive = async (despatch: Despatch, archive: boolean) => {
    if (archiveBusyRef.current || !archiveAvailable) return;
    archiveBusyRef.current = true;
    setArchiveBusy(true);
    setMessage('');
    try {
      if (archive && !(await requestConfirmation('¿Deseas archivar este envío en este navegador? El envío y el pedido se conservan.'))) return;
      const current = readArchive();
      const updated = archive ? Array.from(new Set([...current, despatch.id])) : current.filter((id) => id !== despatch.id);
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(updated));
      const confirmed = readArchive();
      if (confirmed.includes(despatch.id) !== archive) throw new Error('not persisted');
      setArchivedIds(confirmed);
      notify.success(
        archive ? 'El envío se archivó solo en este navegador. El envío y el pedido se conservan.' : 'El envío volvió a la lista de este navegador.',
        archive ? 'Envío archivado' : 'Envío restaurado',
      );
    } catch {
      setMessage('No se pudo guardar el archivo en este navegador. Revisa la lista antes de intentarlo de nuevo.');
    } finally { archiveBusyRef.current = false; setArchiveBusy(false); }
  };

  const changeStatus = async (despatch: Despatch, newStatus: string) => {
    if (statusBusyRef.current || despatch.status === newStatus) return;
    statusBusyRef.current = true;
    setStatusBusy(true);
    setMessage('');
    try {
      if (newStatus === 'delivered' && !(await requestConfirmation('¿Confirmas que el envío ya fue entregado al cliente? Esta acción puede actualizar el estado del pedido.'))) return;
      const response = await fetch(`${API.despatches}/${despatch.id}`, {
        method: 'PUT', headers: authHeaders(), body: JSON.stringify({
          status: newStatus,
          expected: { address: despatch.address, driverId: despatch.driverId, status: despatch.status },
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(typeof data?.message === 'string' ? data.message : 'No se pudo actualizar el estado del envío.');
        return;
      }
      if (data?.id !== despatch.id || data?.status !== newStatus) {
        setMessage('No se pudo confirmar el estado actualizado. Revisa el envío antes de intentarlo de nuevo.');
        loadDespatches();
        return;
      }
      loadDespatches();
      notify.success('El estado del envío se actualizó correctamente.', 'Estado actualizado');
    } catch {
      setMessage('No se pudo confirmar el cambio. Revisa el envío antes de intentarlo de nuevo.');
    } finally { statusBusyRef.current = false; setStatusBusy(false); }
  };

  return (
    <>
      <div className="envios-page">
        <div className="envios-topbar">
          <div>
            <h2 className="titulo-envios">
              Gestión de envíos
            </h2>

            <p className="subtitulo-usuarios">
              Administra los envíos registrados
            </p>
          </div>

          <button
            className="btn-nuevo-envio"
            onClick={openNewModal}
          >
            + Nuevo envío
          </button>
        </div>

        <div className="envio-vistas">
          <button type="button" className="envio-vistas-boton" disabled={archiveBusy || !archiveAvailable}
            onClick={() => setArchivedView((current) => !current)}>
            {archivedView ? 'Ver envíos activos' : 'Ver archivados'}
          </button>
        </div>
        <p className="envio-vista-ayuda">El archivo solo se guarda en este navegador; no elimina envíos ni pedidos.</p>
        {message && <div className="mensaje-envios" role="alert">{message}</div>}

        {loading ? (
          <p
            style={{
              color: 'var(--text)',
              padding: '20px 0',
            }}
          >
            Cargando envíos...
          </p>
        ) : (
          <div className="table-wrapper">
            <table className="tabla-envios">
              <thead>
                <tr>
                  <th>N° Envío</th>
                  <th>Pedido</th>
                  <th>Repartidor</th>
                  <th>Dirección</th>
                  <th>Fecha envío</th>
                  <th>Fecha entrega</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {despatches.filter((item) => archivedIds.includes(item.id) === archivedView).length === 0 && (<tr><td colSpan={8} className="table-empty">{archivedView ? 'No hay envíos archivados.' : 'No hay envíos en esta lista.'}</td></tr>)}
                {despatches.filter((item) => archivedIds.includes(item.id) === archivedView).map((despatch) => (
                  <tr key={despatch.id}>
                    <td className="numero-envio">
                      ENV-{despatch.id.slice(-6).toUpperCase()}
                    </td>

                    <td>
                      {despatch.order
                        ? `PED-${despatch.order.id.slice(-6).toUpperCase()}`
                        : '—'}
                    </td>

                    <td>
                      {despatch.driver?.fullName ?? '—'}
                    </td>

                    <td>
                      {despatch.address ?? '—'}
                    </td>

                    <td>
                      {despatch.shipDate
                        ? despatch.shipDate.split('T')[0]
                        : '—'}
                    </td>

                    <td>
                      {despatch.deliveredAt
                        ? despatch.deliveredAt.split('T')[0]
                        : '—'}
                    </td>

                    <td>
                      <select
                        value={despatch.status}
                        disabled={statusBusy || archivedView}
                        onChange={(e) => changeStatus(despatch, e.target.value)}
                        className={`estado-select ${statusTone[despatch.status] ?? 'tone-neutral'}`}
                      >
                        <option
                          value="in_transit"
                        >
                          En camino
                        </option>

                        <option
                          value="delivered"
                        >
                          Entregado
                        </option>

                        <option
                          value="returned"
                        >
                          Devuelto
                        </option>
                      </select>
                    </td>

                    <td>
                      <div className="envio-acciones">
                        {!archivedView && <button className="btn-editar-envio" onClick={() => handleEdit(despatch)} disabled={archiveBusy}>Editar</button>}
                        <button className="btn-eliminar-envio" disabled={archiveBusy || !archiveAvailable}
                          onClick={() => handleArchive(despatch, !archivedView)}>{archivedView ? 'Restaurar' : 'Archivar'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {modalOpen && (
          <Modal
            titulo={
              editingId !== null
                ? 'Editar envío'
                : 'Nuevo envío'
            }
            onClose={closeModal}
            footer={
              <>
                <button
                  className="btn-cancelar-envio"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button
                  className="btn-guardar-envio"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : editingId !== null
                    ? 'Guardar cambios'
                    : 'Agregar envío'}
                </button>
              </>
            }
          >
            {formError && <div className="mensaje-envios" role="alert">{formError}</div>}
            <p className="label-envio">
              N° Pedido (ID)
            </p>

            <input
              className="input-envio"
              name="orderId"
              value={form.orderId}
              onChange={handleOrderChange}
              placeholder="UUID del pedido"
              disabled={editingId !== null}
            />

            <p className="label-envio">
              Dirección
            </p>

            <input
              className="input-envio"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Se carga automáticamente o escribe manualmente"
            />

            <p className="label-envio">
              Repartidor
            </p>

            <select
              className="input-envio"
              name="driverId"
              value={form.driverId}
              onChange={handleChange}
            >
              <option value="">
                Sin asignar
              </option>

              {drivers.map((driver) => (
                <option
                  key={driver.id}
                  value={driver.id}
                >
                  {driver.fullName}
                </option>
              ))}
            </select>

            <p className="label-envio">
              Estado
            </p>

            <select
              className="input-envio"
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              <option value="in_transit">
                En camino
              </option>
              <option value="delivered">
                Entregado
              </option>
              <option value="returned">
                Devuelto
              </option>
            </select>
          </Modal>
        )}
      </div>
    </>
  );
}