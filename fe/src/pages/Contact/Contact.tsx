import AccountNav from '../../components/layout/AccountNav';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API, authHeaders } from '../../api/api';
import { useAuth } from '../../hooks/useAuth';
import { AlertCircle, Clock, MailCheck, MapPin, Phone } from 'lucide-react';
import './Contact.css';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  // B-01: el mensaje se guarda como PQR del cliente en el servidor.
  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (sending) return;

    if (!form.name || !form.email || !form.message) {
      setError('Por favor completa los campos obligatorios.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }

    if (!user) {
      navigate('/login', { state: { from: '/Contacto' } });
      return;
    }

    if (form.message.trim().length < 20) {
      setError('Cuéntanos un poco más: al menos 20 caracteres.');
      return;
    }

    setError('');
    setSending(true);

    try {
      const response = await fetch(`${API.pqr}/contact`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          topic: form.subject || 'otro',
          message: form.message.trim(),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.message || 'No pudimos enviar tu mensaje. Intenta de nuevo.');
        return;
      }

      setSent(true);
    } catch {
      setError('No pudimos enviar tu mensaje. Revisa tu conexión e intenta de nuevo.');
    } finally {
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
      <div className="contacto-exito page-shell">
        <AccountNav />
        <div className="contacto-exito-icono" aria-hidden="true"><MailCheck size={30} /></div>
        <h1>¡Mensaje enviado!</h1>
        <p>
          Gracias, <strong>{form.name}</strong>. Te responderemos pronto a <strong>{form.email}</strong>.
        </p>
        <button
          className="contacto-btn-primary"
          onClick={() => {
            setSent(false);
            setForm({ name: '', email: '', subject: '', message: '' });
          }}
        >
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  return (
    <div className="contacto-container page-shell">
      <AccountNav />
      <h1 className="contacto-titulo">Contáctanos</h1>
      <p className="contacto-subtitulo">¿Tienes alguna pregunta o sugerencia? Estamos para ayudarte.</p>

      <div className="contacto-grid">
        <div className="contacto-form-card">
          <h2 className="contacto-form-titulo">Envíanos un mensaje</h2>

          <form className="contacto-campos" onSubmit={handleSubmit} noValidate>
            {[
              { label: 'Nombre completo *', name: 'name', type: 'text', placeholder: 'Tu nombre' },
              { label: 'Correo electrónico *', name: 'email', type: 'email', placeholder: 'tu@correo.com' },
            ].map((field) => (
              <div key={field.name} className="contacto-campo">
                <label className="contacto-label" htmlFor={`contacto-${field.name}`}>{field.label}</label>
                <input
                  id={`contacto-${field.name}`}
                  className="contacto-input"
                  type={field.type}
                  name={field.name}
                  value={form[field.name as keyof typeof form]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                />
              </div>
            ))}

            <div className="contacto-campo">
              <label className="contacto-label" htmlFor="contacto-subject">Asunto</label>
              <select id="contacto-subject" className="contacto-input" name="subject" value={form.subject} onChange={handleChange}>
                <option value="">Selecciona un asunto</option>
                <option value="pedido">Consulta sobre pedido</option>
                <option value="producto">Información de producto</option>
                <option value="envio">Envíos y entregas</option>
                <option value="devolucion">Devoluciones</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div className="contacto-campo">
              <label className="contacto-label" htmlFor="contacto-message">Mensaje *</label>
              <textarea
                id="contacto-message"
                className="contacto-textarea"
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Cuéntanos en qué podemos ayudarte..."
                rows={5}
              />
            </div>

            {error && (
              <p className="contacto-error" role="alert">
                <AlertCircle size={16} aria-hidden="true" /> {error}
              </p>
            )}

            {!user && (
              <p className="contacto-nota">
                Para registrar tu mensaje y poder responderte necesitas{' '}
                <Link to="/login">iniciar sesión</Link>.
              </p>
            )}

            <button type="submit" className="contacto-btn-primary" disabled={sending}>
              {sending ? 'Enviando…' : 'Enviar mensaje'}
            </button>
          </form>
        </div>

        <div className="contacto-info">
          <div className="contacto-info-banner">
            <h2>¿Cómo podemos ayudarte?</h2>
            <p>Nuestro equipo de atención al cliente está listo para resolver todas tus dudas sobre pedidos, productos, envíos y más.</p>
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
    </div>
  );
}
