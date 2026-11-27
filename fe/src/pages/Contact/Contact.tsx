import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Clock, MailCheck, MapPin, Phone } from 'lucide-react';
import { API, authHeaders } from '../../api/api';
import { useAuth } from '../../hooks/useAuth';
import AccountNav from '../../components/layout/AccountNav';
import './Contact.css';

export default function Contact() {
  const { user, loading: authLoading } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sendingRef.current || !user || user.role !== 'client') return;

    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();
    if (cleanSubject.length < 5) {
      setError('El asunto debe tener al menos 5 caracteres.');
      return;
    }
    if (cleanMessage.length < 20) {
      setError('El mensaje debe tener al menos 20 caracteres.');
      return;
    }

    sendingRef.current = true;
    setSending(true);
    setError('');
    try {
      const response = await fetch(API.pqr, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          type: 'petition',
          subject: cleanSubject,
          description: cleanMessage,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        if (response.status === 401) {
          setError('Tu sesión expiró. Inicia sesión nuevamente para enviar la solicitud.');
        } else if (response.status === 403) {
          setError('Solo las cuentas de cliente pueden enviar solicitudes.');
        } else {
          setError(data?.message || 'No se pudo registrar tu solicitud. Inténtalo de nuevo.');
        }
        return;
      }

      const result = await response.json().catch(() => null);
      if (!result || typeof result.id !== 'string' || !result.id.trim()) {
        setError('El servidor respondió, pero no pudimos confirmar el registro. Revisa tus solicitudes antes de volver a enviar.');
        return;
      }
      setSent(true);
    } catch {
      setError('Se perdió la conexión y no pudimos confirmar el resultado. Revisa tus solicitudes antes de volver a enviar: podría haberse registrado.');
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  const contactInfo = [
    { icon: MapPin, title: 'Dirección', data: 'Calle 45 #12-30, Bogotá, Colombia' },
    { icon: Phone, title: 'Teléfono', data: '+57 300 123 4567' },
    { icon: Clock, title: 'Horario', data: 'Lun – Vie: 8:00 a. m. – 6:00 p. m.' },
  ];

  if (sent) {
    return (
      <main className="contacto-exito page-shell">
        <AccountNav />
        <div className="contacto-exito-icono" aria-hidden="true"><MailCheck size={30} /></div>
        <h1 aria-live="polite">Solicitud registrada</h1>
        <p>Tu mensaje quedó registrado como una petición asociada a tu cuenta.</p>
        <p><Link to="/cliente/pqr">Consultar mis solicitudes</Link></p>
        <button
          type="button"
          className="contacto-btn-primary"
          onClick={() => {
            setSent(false);
            setSubject('');
            setMessage('');
          }}
        >
          Enviar otro mensaje
        </button>
      </main>
    );
  }

  return (
    <main className="contacto-container page-shell">
      <AccountNav />
      <h1 className="contacto-titulo">Contáctanos</h1>
      <p className="contacto-subtitulo">Envíanos una petición desde tu cuenta de cliente.</p>

      <div className="contacto-grid">
        <div className="contacto-form-card">
          <h2 className="contacto-form-titulo">Envíanos un mensaje</h2>

          {authLoading ? (
            <p role="status">Verificando sesión…</p>
          ) : !user ? (
            <p>Para enviar una solicitud, <Link to="/login">inicia sesión</Link> o <Link to="/register">regístrate</Link>.</p>
          ) : user.role !== 'client' ? (
            <p>Este formulario está disponible para cuentas de cliente.</p>
          ) : (
            <form className="contacto-campos" onSubmit={handleSubmit} noValidate>
              <p>La solicitud se asociará a la cuenta de {user.name} ({user.email}).</p>
              <div className="contacto-campo">
                <label className="contacto-label" htmlFor="contacto-subject">Asunto * (mínimo 5 caracteres)</label>
                <input
                  id="contacto-subject"
                  className="contacto-input"
                  value={subject}
                  onChange={(event) => { setSubject(event.target.value); setError(''); }}
                  maxLength={160}
                  required
                />
              </div>
              <div className="contacto-campo">
                <label className="contacto-label" htmlFor="contacto-message">Mensaje * (mínimo 20 caracteres)</label>
                <textarea
                  id="contacto-message"
                  className="contacto-textarea"
                  value={message}
                  onChange={(event) => { setMessage(event.target.value); setError(''); }}
                  placeholder="Cuéntanos en qué podemos ayudarte..."
                  maxLength={5000}
                  required
                  rows={5}
                />
              </div>
              {error && (
                <p className="contacto-error" role="alert">
                  <AlertCircle size={16} aria-hidden="true" /> {error}
                </p>
              )}
              <button type="submit" className="contacto-btn-primary" disabled={sending}>
                {sending ? 'Enviando…' : 'Enviar mensaje'}
              </button>
              <Link to="/cliente/pqr">Consultar mis solicitudes</Link>
            </form>
          )}
        </div>

        <div className="contacto-info">
          <div className="contacto-info-banner">
            <h2>¿Cómo podemos ayudarte?</h2>
            <p>Puedes consultar el estado de tu petición en PQR y soporte.</p>
          </div>
          {contactInfo.map(({ icon: Icon, ...info }) => (
            <div key={info.title} className="contacto-info-item">
              <span className="contacto-info-icono" aria-hidden="true"><Icon size={20} /></span>
              <div>
                <p className="contacto-info-titulo">{info.title}</p>
                <p className="contacto-info-dato">{info.data}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
