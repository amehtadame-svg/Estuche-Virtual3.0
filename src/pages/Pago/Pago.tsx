import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { API } from '../../api';
import './Pago.css';

type MetodoPago = 'tarjeta' | 'efectivo';

export default function Pago() {
  const { user } = useAuth();
  const { items, total, vaciar } = useCart();
  const navigate = useNavigate();

  const esEmpleado = user?.role === 'empleado';
  const [metodo, setMetodo] = useState<MetodoPago>('tarjeta');
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');

  if (items.length === 0) {
    return (
      <div className="pago-vacio">
        <p>No tienes productos en el carrito.</p>
        <button onClick={() => navigate('/catalogo')}>Ir al catálogo</button>
      </div>
    );
  }

  const confirmarPago = async () => {
    setProcesando(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API.pedidos}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          total,
          metodo_pago: metodo,
          detalles: items.map((item) => ({
            id_producto: item.id,
            cantidad: item.cantidad,
            precio_unitario: item.precio,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.message || 'No se pudo procesar el pedido.');
        return;
      }

      vaciar();
      navigate('/');
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="pago-container">
      <h1 className="pago-titulo">Confirmar pago</h1>

      <div className="pago-resumen">
        {items.map((item) => (
          <div key={item.id} className="pago-linea">
            <span>{item.nombre} ×{item.cantidad}</span>
            <span>${(item.precio * item.cantidad).toLocaleString()}</span>
          </div>
        ))}
        <div className="pago-total">
          <span>Total</span>
          <span>${total.toLocaleString()}</span>
        </div>
      </div>

      <div className="pago-metodo">
        <h2>Método de pago</h2>
        {esEmpleado ? (
          <>
            <label className="pago-opcion">
              <input type="radio" name="metodo" value="tarjeta"
                checked={metodo === 'tarjeta'} onChange={() => setMetodo('tarjeta')} />
              Tarjeta
            </label>
            <label className="pago-opcion">
              <input type="radio" name="metodo" value="efectivo"
                checked={metodo === 'efectivo'} onChange={() => setMetodo('efectivo')} />
              Efectivo
            </label>
          </>
        ) : (
          <p className="pago-metodo-fijo">Pago con tarjeta</p>
        )}
      </div>

      {error && <p className="pago-error">{error}</p>}

      <button className="pago-btn-confirmar" onClick={confirmarPago} disabled={procesando}>
        {procesando ? 'Procesando...' : 'Confirmar pedido'}
      </button>
    </div>
  );
}