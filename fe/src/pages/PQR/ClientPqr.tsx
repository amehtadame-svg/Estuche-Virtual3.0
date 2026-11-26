import AccountNav from '../../components/layout/AccountNav';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { API, authHeaders } from '../../api/api';
import { runApiAction } from '../../lib/apiAction';
import './PQR.css';

type PqrType = 'petition' | 'complaint' | 'claim';
type PqrStatus = 'received' | 'in_progress' | 'answered' | 'closed';

interface PqrRequest {
  id: string;
  type: PqrType;
  subject: string;
  description: string;
  status: PqrStatus;
  response: string | null;
  respondedAt: string | null;
  createdAt: string;
  respondedBy?: { fullName: string } | null;
}

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

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

export default function ClientPqr() {
  const [requests, setRequests] = useState<PqrRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    type: 'petition' as PqrType,
    subject: '',
    description: '',
  });
  const [formError, setFormError] = useState('');

  const loadRequests = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch(API.pqr, { headers: authHeaders() });

      if (!response.ok) {
        throw new Error('No se pudieron cargar tus solicitudes.');
      }

      setRequests(await response.json());
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar tus solicitudes.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    const response = await runApiAction({
      url: API.pqr,
      init: {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(form),
      },
      successMessage: 'Tu PQR quedó registrado correctamente.',
      errorMessage: 'No se pudo registrar el PQR.',
    });

    if (!response) return;

    setForm({
      type: 'petition',
      subject: '',
      description: '',
    });

    await loadRequests();
  };

  return (
    <main className="pqr-page">
      <AccountNav />
      <header className="pqr-heading">
        <div>
          <p className="pqr-eyebrow">ATENCIÓN AL CLIENTE</p>
          <h1>PQR y soporte</h1>
          <p>
            Envíanos una petición, queja o reclamo y consulta aquí su
            seguimiento.
          </p>
        </div>
      </header>

      <div className="pqr-client-grid">
        <section className="pqr-card">
          <h2>Crear una solicitud</h2>
          <p className="pqr-card-intro">
            Cuéntanos cómo podemos ayudarte. Tus datos de cuenta se adjuntan
            automáticamente.
          </p>

          <form className="pqr-form" onSubmit={submit}>
            <label htmlFor="pqr-type">Tipo de solicitud</label>
            <select
              id="pqr-type"
              value={form.type}
              onChange={(event) =>
                setForm({ ...form, type: event.target.value as PqrType })
              }
            >
              <option value="petition">Petición</option>
              <option value="complaint">Queja</option>
              <option value="claim">Reclamo</option>
            </select>

            <label htmlFor="pqr-subject">Asunto</label>
            <input
              id="pqr-subject"
              value={form.subject}
              onChange={(event) =>
                setForm({ ...form, subject: event.target.value })
              }
              minLength={5}
              maxLength={160}
              placeholder="Resume el motivo de tu solicitud"
              required
            />

            <label htmlFor="pqr-description">Descripción</label>
            <textarea
              id="pqr-description"
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              minLength={20}
              maxLength={5000}
              rows={6}
              placeholder="Escribe los detalles de tu petición, queja o reclamo"
              required
            />

            <small className="pqr-help">
              Mínimo 20 caracteres. No incluyas contraseñas ni datos bancarios.
            </small>

            {formError && (
              <p className="pqr-error" role="alert">
                {formError}
              </p>
            )}

            <button className="pqr-primary-btn" type="submit">
              Enviar PQR
            </button>
          </form>
        </section>

        <section className="pqr-card pqr-history-card">
          <div className="pqr-section-heading">
            <div>
              <h2>Mis PQR</h2>
              <p>Solo tú puedes consultar estas solicitudes.</p>
            </div>
            <span className="pqr-count">{requests.length}</span>
          </div>

          {loading ? (
            <p className="pqr-empty">Cargando solicitudes…</p>
          ) : requests.length === 0 ? (
            <p className="pqr-empty">Aún no has enviado solicitudes PQR.</p>
          ) : (
            <div className="pqr-request-list">
              {requests.map((request) => (
                <article className="pqr-request-card" key={request.id}>
                  <div className="pqr-request-topline">
                    <span className={`pqr-type pqr-type-${request.type}`}>
                      {typeLabels[request.type]}
                    </span>
                    <span className={`pqr-status pqr-status-${request.status}`}>
                      {statusLabels[request.status]}
                    </span>
                  </div>

                  <h3>{request.subject}</h3>
                  <p className="pqr-request-description">
                    {request.description}
                  </p>

                  <time dateTime={request.createdAt}>
                    Enviado: {formatDate(request.createdAt)}
                  </time>

                  {request.response && (
                    <div className="pqr-response">
                      <strong>Respuesta del equipo</strong>

                      {request.respondedBy?.fullName && (
                        <small>Por {request.respondedBy.fullName}</small>
                      )}

                      <p>{request.response}</p>

                      {request.respondedAt && (
                        <time dateTime={request.respondedAt}>
                          {formatDate(request.respondedAt)}
                        </time>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}