import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './ClientDashboard.css';

const ClientDashboard = () => {
  const { user } = useAuth();

  const deals = [
    { name: 'Cuaderno universitario', price: 8500, previousPrice: 12000, icon: '📓' },
    { name: 'Set de colores x12', price: 9000, previousPrice: 12000, icon: '🎨' },
    { name: 'Mochila escolar', price: 35000, previousPrice: 45000, icon: '🎒' },
  ];

  const reasons = [
    { icon: '🚀', title: 'Envío rápido', description: 'Recibe tus productos en la puerta de tu casa en el menor tiempo posible.' },
    { icon: '💰', title: 'Mejores precios', description: 'Ofrecemos los precios más competitivos del mercado sin sacrificar calidad.' },
    { icon: '🔒', title: 'Compra segura', description: 'Tu información y pagos están protegidos en todo momento.' },
    { icon: '📦', title: 'Gran variedad', description: 'Encuentra todo lo que necesitas para el colegio y la oficina en un solo lugar.' },
  ];

  return (
    <div className="home-container">
      <section className="hero">
        <h1 className="hero-title">Todo lo que necesitas, en un solo lugar</h1>
        <p className="hero-description">Útiles escolares y de oficina al mejor precio, entregados en tu puerta.</p>

        {user ? (
          <div className="hero-actions">
            <p className="welcome-text">
              Hola, {user.name}. Rol: {user.role}
            </p>
            <Link className="hero-button" to={user.role === 'client' ? '/cliente' : '/admin'}>
              Ir a tu panel
            </Link>
          </div>
        ) : (
          <Link className="hero-button" to="/catalogo">
            Ver productos
          </Link>
        )}
      </section>

      <section className="section">
        <h2 className="section-title">Ofertas y promociones</h2>
        <p className="section-description">Aprovecha estos descuentos por tiempo limitado</p>

        <div className="cards-grid">
          {deals.map((prod) => (
            <div key={prod.name} className="card">
              <span className="badge">Oferta</span>
              <div className="icon">{prod.icon}</div>
              <h3>{prod.name}</h3>
              <p className="old-price">${prod.previousPrice.toLocaleString()}</p>
              <p className="price">${prod.price.toLocaleString()}</p>
              <Link className="card-button" to="/catalogo">
                Ver producto
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Por qué elegirnos</h2>
        <p className="section-description">Estas son las razones por las que nuestros clientes nos prefieren</p>

        <div className="reasons-grid">
          {reasons.map((r) => (
            <div key={r.title} className="reason-card">
              <div className="icon">{r.icon}</div>
              <h3>{r.title}</h3>
              <p>{r.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ClientDashboard;
