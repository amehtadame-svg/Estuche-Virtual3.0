import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { API, authHeaders } from '../../api/api';
import { runApiAction } from '../../lib/apiAction';
import { useAuth } from '../../hooks/useAuth';
import './PQR.css';

type PqrType = 'petition' | 'complaint' | 'claim';
type PqrStatus = 'received' | 'in_progress' | 'answered' | 'closed';

type PqrRequest = {
  id: string;
  type: PqrType;
  subject: string;
  description: string;
  status: PqrStatus;
  response: string | null;
  createdAt: string;
  respondedAt: string | null;
  customer: { fullName: string; email: string };
  respondedBy?: { fullName: string } | null;
};

const typeLabels: Record<PqrType, string> = {
  petition: 'Petición',
  complaint: 'Queja',
  claim: 'Reclamo',
};

const statusLabels: Record<PqrStatus, string> = {
  received: 'Recibido',
  in_progress: 'En proceso',
  answered: 'Respondido',
  closed: 'Cerrado',
};

const filters: { value: 'all' | PqrStatus; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'received', label: 'Recibidos' },
  { value: 'in_progress', label: 'En proceso' },
  { value: 'answered', label: 'Respondidos' },
  { value: 'closed', label: 'Cerrados' },
];

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

export default function AdminPqr() {
  const { user } = useAuth();
  const esAdministracion = user?.role === 'superadmin' || user?.role === 'admin';
  const [requests, setRequests] = useState<PqrRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | PqrStatus>('all');
  const [selected, setSelected] = useState<PqrRequest | null>(null);
  const [status, setStatus] = useState<PqrStatus>('received');
  const [responseText, setResponseText] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(API.pqr, { headers: authHeaders() });

      if (!response.ok) {
        throw new Error('No se pudieron cargar los PQR.');
      }

      setRequests(await response.json());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No se pudieron cargar los PQR.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const openRequest = (request: PqrRequest) => {
    setSelected(request);
    setStatus(request.status);
    setResponseText(request.response ?? '');
  };

  const closeRequest = () => {
    if (savingRef.current) return;
    setSelected(null);
    setResponseText('');
  };

  const saveResponse = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    const respuestaActual = responseText.trim();
    const cambioRespuesta = respuestaActual !== (selected.response ?? '').trim();
    const cambioEstado = status !== selected.status;
    const tituloAviso = cambioRespuesta && cambioEstado ? 'Solicitud actualizada'
      : cambioRespuesta ? 'Respuesta actualizada'
      : cambioEstado ? 'Estado actualizado' : 'Solicitud guardada';
    const mensajeAviso = cambioRespuesta && cambioEstado
      ? respuestaActual
        ? `Se guardaron la respuesta y el estado seleccionado: ${statusLabels[status]}.`
        : `Se eliminó la respuesta y se guardó el estado seleccionado: ${statusLabels[status]}.`
      : cambioRespuesta
        ? respuestaActual ? 'La respuesta de la solicitud se guardó correctamente.' : 'La respuesta de la solicitud se eliminó.'
        : cambioEstado
          ? `El estado seleccionado se guardó como ${statusLabels[status]}.`
          : 'Guardaste el formulario sin modificar los datos mostrados.';
    try {
      const apiResponse = await runApiAction({
        url: `${API.pqr}/${selected.id}`,
        init: {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ status, response: responseText }),
        },
        successMessage: esAdministracion ? mensajeAviso : 'PQR actualizado correctamente.',
        successTitle: esAdministracion ? tituloAviso : undefined,
        errorMessage: 'No se pudo actualizar la solicitud.',
      });
      if (!apiResponse) return;
      setSelected(null);
      setResponseText('');
      await loadRequests();
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const filteredRequests =
    filter === 'all'
      ? requests
      : requests.filter((request) => request.status === filter);

  return (
    <main className="pqr-page pqr-admin-page">
      <header className="pqr-heading pqr-admin-heading">
        <div>
          <p className="pqr-eyebrow">ATENCIÓN AL CLIENTE</p>
          <h1>Gestión de PQR</h1>
          <p>Revisa, responde y actualiza las solicitudes de los clientes.</p>
        </div>
        <span className="pqr-count">{requests.length} solicitudes</span>
      </header>

      <nav className="pqr-filters" aria-label="Filtrar PQR por estado">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`pqr-filter-btn ${filter === item.value ? 'is-active' : ''}`}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {error && (
        <p className="pqr-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <section className="pqr-card">
          <p className="pqr-empty">Cargando solicitudes…</p>
        </section>
      ) : filteredRequests.length === 0 ? (
        <section className="pqr-card">
          <p className="pqr-empty">No hay PQR para mostrar en este filtro.</p>
        </section>
      ) : (
        <div className="pqr-table-wrap">
          <table className="pqr-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Asunto</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <strong>{request.customer.fullName}</strong>
                    <small>{request.customer.email}</small>
                  </td>
                  <td>
                    <span className={`pqr-type pqr-type-${request.type}`}>
                      {typeLabels[request.type]}
                    </span>
                  </td>
                  <td className="pqr-subject-cell">{request.subject}</td>
                  <td>{formatDate(request.createdAt)}</td>
                  <td>
                    <span className={`pqr-status pqr-status-${request.status}`}>
                      {statusLabels[request.status]}
                    </span>
                  </td>
                  <td>
                    <button
                      className="pqr-secondary-btn"
                      type="button"
                      onClick={() => openRequest(request)}
                    >
                      Revisar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="pqr-overlay" onClick={closeRequest}>
          <section
            className="pqr-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pqr-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="pqr-modal-header">
              <div>
                <p className="pqr-eyebrow">{typeLabels[selected.type]}</p>
                <h2 id="pqr-modal-title">{selected.subject}</h2>
              </div>
              <button
                className="pqr-close-btn"
                type="button"
                aria-label="Cerrar"
                disabled={saving}
                onClick={closeRequest}
              >
                ×
              </button>
            </header>

            <div className="pqr-modal-meta">
              <span>
                <strong>Cliente:</strong> {selected.customer.fullName} ·{' '}
                {selected.customer.email}
              </span>
              <span>
                <strong>Recibido:</strong> {formatDate(selected.createdAt)}
              </span>
            </div>

            <div className="pqr-modal-description">{selected.description}</div>

            <form className="pqr-form" onSubmit={saveResponse}>
              <label htmlFor="pqr-admin-status">Estado</label>
              <select
                id="pqr-admin-status"
                disabled={saving}
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as PqrStatus)
                }
              >
                <option value="received">Recibido</option>
                <option value="in_progress">En proceso</option>
                <option value="answered">Respondido</option>
                <option value="closed">Cerrado</option>
              </select>

              <label htmlFor="pqr-admin-response">
                Respuesta para el cliente
              </label>
              <textarea
                id="pqr-admin-response"
                disabled={saving}
                value={responseText}
                onChange={(event) => setResponseText(event.target.value)}
                maxLength={5000}
                rows={5}
                placeholder="Escribe la respuesta o actualización para el cliente"
              />

              <div className="pqr-modal-actions">
                <button
                  className="pqr-secondary-btn"
                  type="button"
                  disabled={saving}
                  onClick={closeRequest}
                >
                  Cancelar
                </button>
                <button className="pqr-primary-btn" type="submit" disabled={saving}>
                  {saving ? 'Guardando…' : 'Guardar respuesta'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}