import { useState } from 'react';
import './Contacto.css';

export default function Contacto() {
  const [form, setForm] = useState({ nombre: '', email: '', asunto: '', mensaje: '' });
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = () => {
    if (!form.nombre || !form.email || !form.mensaje) {
      setError('Por favor completa los campos obligatorios.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    setEnviado(true);
  };

  const handleWhatsApp = () => {
    window.open(
      'https://wa.me/573204125692?text=Hola,%20quiero%20más%20información%20sobre%20sus%20productos.',
      '_blank'
    );
  };

  const infoContacto = [
    { icono: '📍', titulo: 'Dirección', dato: 'Calle 45 #12-30, Bogotá, Colombia' },
    { icono: '📞', titulo: 'Teléfono', dato: '+57 300 123 4' },
    { icono: '✉️', titulo: 'Correo', dato: 'hola@estuchevirtual.com' },
    { icono: '⏰', titulo: 'Horario', dato: 'Lun – Vie: 8 am – 6 pm' },
  ];

  if (enviado) {
    return (
      <>
        <div className="contacto-exito">
          <div className="contacto-exito-icono">📬</div>
          <h1>¡Mensaje enviado!</h1>
          <p>
            Gracias, <strong>{form.nombre}</strong>. Te responderemos pronto a <strong>{form.email}</strong>.
          </p>
          <button
            className="contacto-btn-primary"
            onClick={() => { setEnviado(false); setForm({ nombre: '', email: '', asunto: '', mensaje: '' }); }}
          >
            Enviar otro mensaje
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="contacto-container">
        <h1 className="contacto-titulo">Contáctanos</h1>
        <p className="contacto-subtitulo">¿Tienes alguna pregunta o sugerencia? Estamos para ayudarte.</p>

        <div className="contacto-grid">

          <div className="contacto-form-card">
            <h2 className="contacto-form-titulo">Envíanos un mensaje</h2>

            <div className="contacto-campos">
              {[
                { label: 'Nombre completo *', name: 'nombre', type: 'text', placeholder: 'Tu nombre' },
                { label: 'Correo electrónico *', name: 'email', type: 'email', placeholder: 'tu@correo.com' },
              ].map(campo => (
                <div key={campo.name} className="contacto-campo">
                  <label className="contacto-label">{campo.label}</label>
                  <input
                    className="contacto-input"
                    type={campo.type}
                    name={campo.name}
                    value={form[campo.name as keyof typeof form]}
                    onChange={handleChange}
                    placeholder={campo.placeholder}
                  />
                </div>
              ))}

              <div className="contacto-campo">
                <label className="contacto-label">Asunto</label>
                <select className="contacto-input" name="asunto" value={form.asunto} onChange={handleChange}>
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
                  name="mensaje"
                  value={form.mensaje}
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

            {infoContacto.map(info => (
              <div key={info.titulo} className="contacto-info-item">
                <span className="contacto-info-icono">{info.icono}</span>
                <div>
                  <p className="contacto-info-titulo">{info.titulo}</p>
                  <p className="contacto-info-dato">{info.dato}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

