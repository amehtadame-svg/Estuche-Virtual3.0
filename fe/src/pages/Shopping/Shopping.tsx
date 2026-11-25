import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import CategoryIcon from '../../components/ui/CategoryIcon';
import './Shopping.css';

export default function Shopping() {
  const { user } = useAuth();
  const { items, remove, updateQuantity, clear, total } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <main className="empty-state">
        <span className="empty-state-icon" aria-hidden="true">
          <ShoppingCart size={34} />
        </span>
        <h1>Tu carrito está vacío</h1>
        <p>Agrega productos desde el catálogo para empezar tu compra.</p>
        <button type="button" className="ui-btn ui-btn--primary" onClick={() => navigate('/catalogo')}>
          Ver catálogo
        </button>
      </main>
    );
  }

  return (
    <div className="carrito-container">
      <div className="carrito-header">
        <h1 className="carrito-titulo">Tu carrito</h1>
        <button className="carrito-btn-vaciar" onClick={clear}>
          <Trash2 size={15} aria-hidden="true" /> Vaciar carrito
        </button>
      </div>

      <div className="carrito-body">
        <div className="carrito-items">
          {items.map((item) => (
            <div key={item.id} className="carrito-item">
              <div className="carrito-item-icono"><CategoryIcon category={item.category} /></div>

              <div className="carrito-item-info">
                <p className="carrito-item-nombre">{item.name}</p>
                <p className="carrito-item-cat">{item.category}</p>
                <p className="carrito-item-precio-u">${item.price.toLocaleString()} c/u</p>
              </div>

              <div className="carrito-item-cantidad">
                <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                  −
                </button>
                <span className="qty-num">{item.quantity}</span>
                <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                  +
                </button>
              </div>

              <p className="carrito-item-subtotal">${(item.price * item.quantity).toLocaleString()}</p>

              <button className="carrito-item-quitar" onClick={() => remove(item.id)} title="Eliminar">
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
                <span>
                  {item.name} ×{item.quantity}
                </span>
                <span>${(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="resumen-total">
            <span>Total</span>
            <span>${total.toLocaleString()}</span>
          </div>

          <button className="resumen-btn-pagar" onClick={() => navigate(user ? '/Pago' : '/login')}>
            Proceder al pago
          </button>

          <button className="resumen-btn-seguir" onClick={() => navigate('/catalogo')}>
            Seguir comprando
          </button>
        </div>
      </div>
    </div>
  );
}