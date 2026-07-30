import { useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import './Carrito.css';

export default function Carrito() {
    const { user } = useAuth();
  const { items, quitar, cambiarCantidad, vaciar, total } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <>
        <div className="carrito-vacio">
          <div className="carrito-vacio-icono">🛒</div>
          <h2>Tu carrito está vacío</h2>
          <p>Agrega productos desde el catálogo para empezar.</p>
          <button className="carrito-btn-catalogo" onClick={() => navigate('/catalogo')}>
            Ver catálogo
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="carrito-container">

        <div className="carrito-header">
          <h1 className="carrito-titulo">Tu carrito</h1>
          <button className="carrito-btn-vaciar" onClick={vaciar}>
            🗑 Vaciar carrito
          </button>
        </div>

        <div className="carrito-body">

          <div className="carrito-items">
            {items.map((item) => (
              <div key={item.id} className="carrito-item">
                <div className="carrito-item-icono">{item.icono}</div>

                <div className="carrito-item-info">
                  <p className="carrito-item-nombre">{item.nombre}</p>
                  <p className="carrito-item-cat">{item.categoria}</p>
                  <p className="carrito-item-precio-u">
                    ${item.precio.toLocaleString()} c/u
                  </p>
                </div>

                <div className="carrito-item-cantidad">
                  <button
                    className="qty-btn"
                    onClick={() => cambiarCantidad(item.id, item.cantidad - 1)}
                  >
                    −
                  </button>
                  <span className="qty-num">{item.cantidad}</span>
                  <button
                    className="qty-btn"
                    onClick={() => cambiarCantidad(item.id, item.cantidad + 1)}
                  >
                    +
                  </button>
                </div>

                <p className="carrito-item-subtotal">
                  ${(item.precio * item.cantidad).toLocaleString()}
                </p>

                <button
                  className="carrito-item-quitar"
                  onClick={() => quitar(item.id)}
                  title="Eliminar"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="carrito-resumen">
            <h2 className="resumen-titulo">Resumen del pedido</h2>

            <div className="resumen-lineas">
              {items.map((item) => (
                <div key={item.id} className="resumen-linea">
                  <span>{item.nombre} ×{item.cantidad}</span>
                  <span>${(item.precio * item.cantidad).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="resumen-total">
              <span>Total</span>
              <span>${total.toLocaleString()}</span>
            </div>

            <button className="resumen-btn-pagar" onClick={() => navigate(user ? `/Pago` : `/login`)}>
              Proceder al pago
            </button>

            <button
              className="resumen-btn-seguir"
              onClick={() => navigate('/catalogo')}
            >
              Seguir comprando
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
