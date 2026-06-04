import { Link } from 'react-router-dom';

export default function Home() {

  const ofertas = [
    { nombre: 'Cuaderno universitario', precio: 8500, precioAntes: 12000, icono: '📓' },
    { nombre: 'Set de colores x12', precio: 9000, precioAntes: 12000, icono: '🎨' },
    { nombre: 'Mochila escolar', precio: 35000, precioAntes: 45000, icono: '🎒' },
  ];

  const razones = [
    { icono: '🚀', titulo: 'Envio rapido', descripcion: 'Recibe tus productos en la puerta de tu casa en el menor tiempo posible.' },
    { icono: '💰', titulo: 'Mejores precios', descripcion: 'Ofrecemos los precios mas competitivos del mercado sin sacrificar calidad.' },
    { icono: '🔒', titulo: 'Compra segura', descripcion: 'Tu informacion y pagos estan protegidos en todo momento.' },
    { icono: '📦', titulo: 'Gran variedad', descripcion: 'Encuentra todo lo que necesitas para el colegio y la oficina en un solo lugar.' },
  ];

  return (
    <div>

      <section style={{
        backgroundColor: 'var(--accent-bg)',
        padding: '80px 40px',
        textAlign: 'center',
        borderRadius: '12px',
        marginBottom: '40px'
      }}>
        <h1 style={{ color: 'var(--accent)', marginBottom: '16px' }}>
          Todo lo que necesitas, en un solo lugar
        </h1>
        <p style={{ fontSize: '18px', color: 'var(--text)', marginBottom: '32px' }}>
          Utiles escolares y de oficina al mejor precio, entregados en tu puerta.
        </p>
        <Link to="/productos" style={{
          display: 'inline-block',
          backgroundColor: 'var(--accent)',
          color: '#fff',
          padding: '14px 32px',
          borderRadius: '8px',
          fontSize: '16px',
          textDecoration: 'none'
        }}>
          Ver productos
        </Link>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: 'var(--text-h)', marginBottom: '8px' }}>Ofertas y promociones</h2>
        <p style={{ color: 'var(--text)', fontSize: '15px', marginBottom: '32px' }}>
          Aprovecha estos descuentos por tiempo limitado
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px'
        }}>
          {ofertas.map((prod) => (
            <div key={prod.nombre} style={{
              backgroundColor: 'var(--bg)',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              border: '1px solid var(--border)',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                backgroundColor: '#e74c3c',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 500,
                padding: '4px 10px',
                borderRadius: '99px'
              }}>
                Oferta
              </div>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>{prod.icono}</div>
              <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-h)', marginBottom: '8px' }}>
                {prod.nombre}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text)', textDecoration: 'line-through', marginBottom: '4px' }}>
                ${prod.precioAntes.toLocaleString()}
              </p>
              <p style={{ fontSize: '20px', color: 'var(--accent)', fontWeight: 600, marginBottom: '16px' }}>
                ${prod.precio.toLocaleString()}
              </p>
              <Link to="/productos" style={{
                display: 'block',
                backgroundColor: 'var(--accent)',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px'
              }}>
                Ver producto
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ color: 'var(--text-h)', marginBottom: '8px' }}>Por que elegirnos</h2>
        <p style={{ color: 'var(--text)', fontSize: '15px', marginBottom: '32px' }}>
          Estas son las razones por las que nuestros clientes nos prefieren
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '24px'
        }}>
          {razones.map((r) => (
            <div key={r.titulo} style={{
              backgroundColor: 'var(--bg)',
              borderRadius: '12px',
              padding: '28px 20px',
              textAlign: 'center',
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>{r.icono}</div>
              <h2 style={{ marginBottom: '8px', fontSize: '15px' }}>{r.titulo}</h2>
              <p style={{ color: 'var(--text)', fontSize: '13px', lineHeight: '1.6' }}>{r.descripcion}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}