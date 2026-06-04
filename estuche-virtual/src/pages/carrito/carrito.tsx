import { useState } from 'react';
import { Link } from 'react-router-dom';

interface ItemCarrito {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  icono: string;
}

const itemsIniciales: ItemCarrito[] = [
  { id: 1, nombre: 'Cuaderno universitario', precio: 8500, cantidad: 2, icono: '📓' },
  { id: 2, nombre: 'Set de colores x12', precio: 9000, cantidad: 1, icono: '🎨' },
  { id: 3, nombre: 'Mochila escolar', precio: 35000, cantidad: 1, icono: '🎒' },
];

export default function Carrito() {
  const [items, setItems] = useState<ItemCarrito[]>(itemsIniciales);
  const [pedidoEnviado, setPedidoEnviado] = useState(false);

  const cambiarCantidad = (id: number, delta: number) => {
    setItems(prev =>
      prev
        .map(item => item.id === id ? { ...item, cantidad: item.cantidad + delta } : item)
        .filter(item => item.cantidad > 0)
    );
  };

  const eliminar = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  const envio = subtotal > 50000 ? 0 : 8000;
  const total = subtotal + envio;

  if (pedidoEnviado) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 40px' }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>✅</div>
        <h1 style={{ color: 'var(--text-h)', marginBottom: '12px' }}>¡Pedido realizado!</h1>
        <p style={{ color: 'var(--text)', marginBottom: '32px', fontSize: '16px' }}>
          Gracias por tu compra. En breve recibirás la confirmación.
        </p>
        <Link to="/" style={{
          backgroundColor: 'var(--accent)', color: '#fff',
          padding: '12px 28px', borderRadius: '8px', textDecoration: 'none', fontSize: '15px'
        }}>
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ color: 'var(--text-h)', marginBottom: '8px' }}>Mi carrito</h1>
      <p style={{ color: 'var(--text)', fontSize: '15px', marginBottom: '32px' }}>
        Revisa y confirma tu pedido
      </p>

      {items.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 40px',
          backgroundColor: 'var(--accent-bg)', borderRadius: '12px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</div>
          <p style={{ color: 'var(--text)', marginBottom: '24px', fontSize: '16px' }}>
            Tu carrito está vacío.
          </p>
          <Link to="/productos" style={{
            backgroundColor: 'var(--accent)', color: '#fff',
            padding: '12px 28px', borderRadius: '8px', textDecoration: 'none'
          }}>
            Ver productos
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px', alignItems: 'start' }}>

          {/* Lista de productos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {items.map(item => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: '20px',
                backgroundColor: 'var(--bg)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '20px'
              }}>
                <div style={{ fontSize: '40px' }}>{item.icono}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, color: 'var(--text-h)', marginBottom: '4px' }}>
                    {item.nombre}
                  </p>
                  <p style={{ color: 'var(--accent)', fontWeight: 600 }}>
                    ${item.precio.toLocaleString()}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button onClick={() => cambiarCantidad(item.id, -1)} style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    border: '1px solid var(--border)', background: 'var(--bg)',
                    cursor: 'pointer', fontSize: '16px', color: 'var(--text-h)'
                  }}>−</button>
                  <span style={{ fontWeight: 600, minWidth: '20px', textAlign: 'center' }}>
                    {item.cantidad}
                  </span>
                  <button onClick={() => cambiarCantidad(item.id, 1)} style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    border: '1px solid var(--border)', background: 'var(--bg)',
                    cursor: 'pointer', fontSize: '16px', color: 'var(--text-h)'
                  }}>+</button>
                </div>
                <p style={{ fontWeight: 600, color: 'var(--text-h)', minWidth: '80px', textAlign: 'right' }}>
                  ${(item.precio * item.cantidad).toLocaleString()}
                </p>
                <button onClick={() => eliminar(item.id)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#e74c3c', fontSize: '18px'
                }}>🗑️</button>
              </div>
            ))}
          </div>

          {/* Resumen del pedido */}
          <div style={{
            backgroundColor: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '24px', position: 'sticky', top: '80px'
          }}>
            <h2 style={{ color: 'var(--text-h)', marginBottom: '20px', fontSize: '18px' }}>
              Resumen del pedido
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text)' }}>
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text)' }}>
                <span>Envío</span>
                <span style={{ color: envio === 0 ? '#27ae60' : 'var(--text)' }}>
                  {envio === 0 ? 'Gratis 🎉' : `$${envio.toLocaleString()}`}
                </span>
              </div>
              {envio > 0 && (
                <p style={{ fontSize: '12px', color: 'var(--text)', backgroundColor: 'var(--accent-bg)', padding: '8px 12px', borderRadius: '8px' }}>
                  Agrega ${(50000 - subtotal).toLocaleString()} más para envío gratis
                </p>
              )}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-h)' }}>Total</span>
                <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '20px' }}>
                  ${total.toLocaleString()}
                </span>
              </div>
            </div>

            <button onClick={() => setPedidoEnviado(true)} style={{
              width: '100%', backgroundColor: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: '8px', padding: '14px',
              fontSize: '15px', fontWeight: 600, cursor: 'pointer'
            }}>
              Confirmar pedido
            </button>
            <Link to="/productos" style={{
              display: 'block', textAlign: 'center', marginTop: '12px',
              color: 'var(--accent)', fontSize: '14px', textDecoration: 'none'
            }}>
              ← Seguir comprando
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
