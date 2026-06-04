import { Link } from 'react-router-dom';

export default function Nosotros() {
  const equipo = [
    { nombre: 'Ameht Adame', cargo: 'Backend', icono: '🤵', descripcion: 'Apasionado por la implementacion de nuevas tecnologias.' },
    { nombre: 'Frack Salamanca', cargo: 'Backend', icono: '👨‍💻', descripcion: 'Administrador de ideas y caracterización.' },
    { nombre: 'Cristian Alvarado', cargo: 'Full stack', icono: '👩‍🎤', descripcion: 'Administrador de la gestion y logistica de la aplicación web.' },
    { nombre: 'Paula Garces', cargo: 'Frontend', icono: '👩‍🎤', descripcion: 'Encargada de los diseños y fotos de la aplicación web.' },
    { nombre: 'Isabella Olivares', cargo: 'Frontend', icono: '👩‍🎤', descripcion: 'ilustradora diseño y colores.' },
  ];

  const valores = [
    { icono: '🌱', titulo: 'Sostenibilidad', descripcion: 'Trabajamos con proveedores responsables y materiales amigables con el medio ambiente.' },
    { icono: '🤝', titulo: 'Confianza', descripcion: 'Construimos relaciones duraderas con nuestros clientes basadas en la transparencia.' },
    { icono: '💡', titulo: 'Innovación', descripcion: 'Buscamos constantemente nuevas formas de mejorar tu experiencia de compra.' },
    { icono: '❤️', titulo: 'Comunidad', descripcion: 'Apoyamos a colegios y fundaciones con donaciones de útiles escolares.' },
  ];

  const hitos = [
    { año: '2019', texto: 'Fundación de Estuche Virtual en Bogotá con un pequeño catálogo de 50 productos.' },
    { año: '2020', texto: 'Lanzamiento de la tienda en línea. Primeros 500 pedidos en el primer mes.' },
    { año: '2022', texto: 'Expansión a nivel nacional. Más de 10.000 clientes satisfechos.' },
    { año: '2024', texto: 'Nueva plataforma digital y catálogo de más de 1.000 productos.' },
  ];

  return (
    <div>
      {/* Hero */}
      <section style={{
        backgroundColor: 'var(--accent-bg)', borderRadius: '12px',
        padding: '60px 40px', textAlign: 'center', marginBottom: '48px'
      }}>
        <h1 style={{ color: 'var(--accent)', marginBottom: '16px', fontSize: '32px' }}>
          Somos Estuche Virtual
        </h1>
        <p style={{ color: 'var(--text)', fontSize: '17px', maxWidth: '600px', margin: '0 auto', lineHeight: '1.7' }}>
          Nacimos con el objetivo de hacer más fácil el acceso a útiles escolares y de oficina de calidad, 
          directamente a la puerta de tu hogar.
        </p>
      </section>

      {/* Misión y Visión */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '48px' }}>
        {[
          { titulo: '🎯 Nuestra misión', texto: 'Brindar a estudiantes, padres y profesionales una experiencia de compra ágil, confiable y asequible en útiles escolares y de oficina, con la mejor atención al cliente del mercado.' },
          { titulo: '🔭 Nuestra visión', texto: 'Convertirnos en la tienda en línea de útiles escolares más querida de Colombia, reconocida por su variedad, calidad y compromiso con la educación.' },
        ].map(item => (
          <div key={item.titulo} style={{
            backgroundColor: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '32px'
          }}>
            <h2 style={{ color: 'var(--text-h)', marginBottom: '16px', fontSize: '18px' }}>
              {item.titulo}
            </h2>
            <p style={{ color: 'var(--text)', lineHeight: '1.7', fontSize: '15px' }}>{item.texto}</p>
          </div>
        ))}
      </section>

      {/* Valores */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: 'var(--text-h)', marginBottom: '8px' }}>Nuestros valores</h2>
        <p style={{ color: 'var(--text)', fontSize: '15px', marginBottom: '28px' }}>
          Los principios que guían cada decisión que tomamos
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          {valores.map(v => (
            <div key={v.titulo} style={{
              backgroundColor: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '24px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>{v.icono}</div>
              <h3 style={{ color: 'var(--text-h)', fontSize: '15px', marginBottom: '8px' }}>{v.titulo}</h3>
              <p style={{ color: 'var(--text)', fontSize: '13px', lineHeight: '1.6' }}>{v.descripcion}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Historia / Hitos */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: 'var(--text-h)', marginBottom: '8px' }}>Nuestra historia</h2>
        <p style={{ color: 'var(--text)', fontSize: '15px', marginBottom: '28px' }}>
          Un recorrido de esfuerzo y crecimiento
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {hitos.map((hito, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: '20px',
              backgroundColor: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '20px'
            }}>
              <div style={{
                backgroundColor: 'var(--accent)', color: '#fff',
                borderRadius: '8px', padding: '6px 14px',
                fontSize: '14px', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0
              }}>
                {hito.año}
              </div>
              <p style={{ color: 'var(--text)', fontSize: '15px', lineHeight: '1.6', paddingTop: '4px' }}>
                {hito.texto}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Equipo */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: 'var(--text-h)', marginBottom: '8px' }}>Nuestro equipo</h2>
        <p style={{ color: 'var(--text)', fontSize: '15px', marginBottom: '28px' }}>
          Las personas detrás de Estuche Virtual
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {equipo.map(persona => (
            <div key={persona.nombre} style={{
              backgroundColor: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '32px', textAlign: 'center'
            }}>
              <div style={{
                fontSize: '56px', marginBottom: '16px',
                backgroundColor: 'var(--accent-bg)', width: '80px', height: '80px',
                borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 16px'
              }}>
                {persona.icono}
              </div>
              <h3 style={{ color: 'var(--text-h)', fontSize: '16px', marginBottom: '4px' }}>{persona.nombre}</h3>
              <p style={{ color: 'var(--accent)', fontSize: '13px', fontWeight: 500, marginBottom: '12px' }}>
                {persona.cargo}
              </p>
              <p style={{ color: 'var(--text)', fontSize: '13px', lineHeight: '1.6' }}>{persona.descripcion}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        backgroundColor: 'var(--accent-bg)', borderRadius: '12px',
        padding: '48px 40px', textAlign: 'center'
      }}>
        <h2 style={{ color: 'var(--text-h)', marginBottom: '12px' }}>¿Listo para comprar?</h2>
        <p style={{ color: 'var(--text)', marginBottom: '28px', fontSize: '15px' }}>
          Explora nuestro catálogo y encuentra todo lo que necesitas.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/productos" style={{
            backgroundColor: 'var(--accent)', color: '#fff',
            padding: '12px 28px', borderRadius: '8px', textDecoration: 'none', fontSize: '15px'
          }}>
            Ver productos
          </Link>
          <Link to="/contacto" style={{
            backgroundColor: 'transparent', color: 'var(--accent)',
            padding: '12px 28px', borderRadius: '8px', textDecoration: 'none',
            fontSize: '15px', border: '1px solid var(--accent)'
          }}>
            Contáctanos
          </Link>
        </div>
      </section>
    </div>
  );
}
