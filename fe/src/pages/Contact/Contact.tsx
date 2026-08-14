import { useState } from 'react';
import './Contact.css';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.message) {
      setError('Por favor completa los campos obligatorios.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    setSent(true);
  };

  const contactInfo = [
    { icon: '📍', title: 'Dirección', data: 'Calle 45 #12-30, Bogotá, Colombia' },
    { icon: '📞', title: 'Teléfono', data: '+57 300 123 4' },
    { icon: '✉️', title: 'Correo', data: 'hola@estuchevirtual.com' },
    { icon: '⏰', title: 'Horario', data: 'Lun – Vie: 8 am – 6 pm' },
  ];

  if (sent) {
    return (
      <div className="contacto-exito">
        <div className="contacto-exito-icono">📬</div>
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
    <div className="contacto-container">
      <h1 className="contacto-titulo">Contáctanos</h1>
      <p className="contacto-subtitulo">¿Tienes alguna pregunta o sugerencia? Estamos para ayudarte.</p>

      <div className="contacto-grid">
        <div className="contacto-form-card">
          <h2 className="contacto-form-titulo">Envíanos un mensaje</h2>

          <div className="contacto-campos">
            {[
              { label: 'Nombre completo *', name: 'name', type: 'text', placeholder: 'Tu nombre' },
              { label: 'Correo electrónico *', name: 'email', type: 'email', placeholder: 'tu@correo.com' },
            ].map((field) => (
              <div key={field.name} className="contacto-campo">
                <label className="contacto-label">{field.label}</label>
                <input
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
              <label className="contacto-label">Asunto</label>
              <select className="contacto-input" name="subject" value={form.subject} onChange={handleChange}>
                <option value="">Selecciona un asunto</option>
                <option value="pedido">Consulta sobre pedido</option>
                <option value="producto">Información de producto</option>
                <option value="envio">Envíos y entregas</option>
                <option value="devolucion">Devoluciones</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div className="contacto-campo">
              <label className="contacto-label">Mensaje *</label>
              <textarea
                className="contacto-textarea"
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Cuéntanos en qué podemos ayudarte..."
                rows={5}
              />
            </div>

            {error && <p className="contacto-error">⚠️ {error}</p>}

            <button className="contacto-btn-primary" onClick={handleSubmit}>
              Enviar mensaje
            </button>
          </div>
        </div>

        <div className="contacto-info">
          <div className="contacto-info-banner">
            <h2>¿Cómo podemos ayudarte?</h2>
            <p>Nuestro equipo de atención al cliente está listo para resolver todas tus dudas sobre pedidos, productos, envíos y más.</p>
          </div>

          {contactInfo.map((info) => (
            <div key={info.title} className="contacto-info-item">
              <span className="contacto-info-icono">{info.icon}</span>
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
