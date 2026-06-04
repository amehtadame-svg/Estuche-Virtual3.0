import { useState } from 'react';

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
 
  const infoContacto = [
    { icono: '📍', titulo: 'Dirección', dato: 'Calle 45 #12-30, Bogotá, Colombia' },
    { icono: '📞', titulo: 'Teléfono', dato: '+57 300 123 4' }, 
    { icono: '✉️', titulo: 'Correo', dato: 'hola@estuchevirtual.com' },
    { icono: '⏰', titulo: 'Horario', dato: 'Lun – Vie: 8 am – 6 pm' },
  ];

  if (enviado) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 40px' }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>📬</div>
        <h1 style={{ color: 'var(--text-h)', marginBottom: '12px' }}>¡Mensaje enviado!</h1>
        <p style={{ color: 'var(--text)', fontSize: '16px', marginBottom: '32px' }}>
          Gracias, <strong>{form.nombre}</strong>. Te responderemos pronto a <strong>{form.email}</strong>.
        </p>
        <button onClick={() => { setEnviado(false); setForm({ nombre: '', email: '', asunto: '', mensaje: '' }); }}
          style={{
            backgroundColor: 'var(--accent)', color: '#fff',
            border: 'none', padding: '12px 28px', borderRadius: '8px',
            cursor: 'pointer', fontSize: '15px'
          }}>
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ color: 'var(--text-h)', marginBottom: '8px' }}>Contáctanos</h1>
      <p style={{ color: 'var(--text)', fontSize: '15px', marginBottom: '40px' }}>
        ¿Tienes alguna pregunta o sugerencia? Estamos para ayudarte.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'start' }}>

        {/* Formulario */}
        <div style={{
          backgroundColor: 'var(--bg)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '32px'
        }}>
          <h2 style={{ color: 'var(--text-h)', marginBottom: '24px', fontSize: '18px' }}>
            Envíanos un mensaje
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { label: 'Nombre completo *', name: 'nombre', type: 'text', placeholder: 'Tu nombre' },
              { label: 'Correo electrónico *', name: 'email', type: 'email', placeholder: 'tu@correo.com' },
            ].map(campo => (
              <div key={campo.name}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-h)', marginBottom: '6px' }}>
                  {campo.label}
                </label>
                <input
                  type={campo.type}
                  name={campo.name}
                  value={form[campo.name as keyof typeof form]}
                  onChange={handleChange}
                  placeholder={campo.placeholder}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '8px',
                    border: '1px solid var(--border)', fontSize: '14px',
                    outline: 'none', color: 'var(--text-h)', background: 'var(--bg)'
                  }}
                />
              </div>
            ))}

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-h)', marginBottom: '6px' }}>
                Asunto
              </label>
              <select
                name="asunto"
                value={form.asunto}
                onChange={handleChange}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                  border: '1px solid var(--border)', fontSize: '14px',
                  color: 'var(--text)', background: 'var(--bg)', outline: 'none'
                }}
              >
                <option value="">Selecciona un asunto</option>
                <option value="pedido">Consulta sobre pedido</option>
                <option value="producto">Información de producto</option>
                <option value="envio">Envíos y entregas</option>
                <option value="devolucion">Devoluciones</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-h)', marginBottom: '6px' }}>
                Mensaje *
              </label>
              <textarea
                name="mensaje"
                value={form.mensaje}
                onChange={handleChange}
                placeholder="Cuéntanos en qué podemos ayudarte..."
                rows={5}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                  border: '1px solid var(--border)', fontSize: '14px',
                  outline: 'none', color: 'var(--text-h)', background: 'var(--bg)',
                  resize: 'vertical', fontFamily: 'inherit'
                }}
              />
            </div>

            {error && (
              <p style={{ color: '#e74c3c', fontSize: '13px', backgroundColor: '#fdf0f0', padding: '10px 14px', borderRadius: '8px' }}>
                ⚠️ {error}
              </p>
            )}

            <button onClick={handleSubmit} style={{
              backgroundColor: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: '8px', padding: '13px',
              fontSize: '15px', fontWeight: 600, cursor: 'pointer', width: '100%'
            }}>
              Enviar mensaje
            </button>
          </div>
        </div>

        {/* Info de contacto */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            backgroundColor: 'var(--accent-bg)', borderRadius: '12px',
            padding: '28px', marginBottom: '8px'
          }}>
            <h2 style={{ color: 'var(--text-h)', fontSize: '18px', marginBottom: '8px' }}>
              ¿Cómo podemos ayudarte?
            </h2>
            <p style={{ color: 'var(--text)', fontSize: '14px', lineHeight: '1.6' }}>
              Nuestro equipo de atención al cliente está listo para resolver todas tus dudas sobre pedidos, productos, envíos y más.
            </p>
          </div>

          {infoContacto.map(info => (
            <div key={info.titulo} style={{
              display: 'flex', alignItems: 'flex-start', gap: '16px',
              backgroundColor: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '20px'
            }}>
              <span style={{ fontSize: '28px' }}>{info.icono}</span>
              <div>
                <p style={{ fontWeight: 600, color: 'var(--text-h)', marginBottom: '4px', fontSize: '14px' }}>
                  {info.titulo}{}
                </p>
                <p style={{ color: 'var(--text)', fontSize: '14px' }}>{info.dato}</p>
              </div>
            </div>
          ))}
          {/* Botones de contacto rápido */}
<div
  style={{
    display: 'flex',
    gap: '12px',
    marginTop: '12px',
    flexWrap: 'wrap'
  }}
>
  <a
    href="https://wa.me/573204125692?text=Hola,%20quiero%20más%20información%20sobre%20sus%20productos."
    target="_blank"
    rel="noopener noreferrer"
    style={{
      flex: 1,
      minWidth: '180px',
      textAlign: 'center',
      backgroundColor: '#25D366',
      color: '#fff',
      textDecoration: 'none',
      padding: '14px',
      borderRadius: '10px',
      fontWeight: 600,
      fontSize: '15px'
    }}
  >
    📱 Escríbenos por WhatsApp
  </a>
</div>
        </div>
      </div>
    </div>
  );
}
