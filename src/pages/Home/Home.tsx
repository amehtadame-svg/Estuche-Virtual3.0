import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header/Header';
import './Home.css';

const Home = () => {
  const { user, logout } = useAuth();

  const ofertas = [
    { nombre: 'Cuaderno universitario', precio: 8500, precioAntes: 12000, icono: '📓' },
    { nombre: 'Set de colores x12', precio: 9000, precioAntes: 12000, icono: '🎨' },
    { nombre: 'Mochila escolar', precio: 35000, precioAntes: 45000, icono: '🎒' },
  ];

  const razones = [
    {
      icono: '🚀',
      titulo: 'Envío rápido',
      descripcion: 'Recibe tus productos en la puerta de tu casa en el menor tiempo posible.',
    },
    {
      icono: '💰',
      titulo: 'Mejores precios',
      descripcion: 'Ofrecemos los precios más competitivos del mercado sin sacrificar calidad.',
    },
    {
      icono: '🔒',
      titulo: 'Compra segura',
      descripcion: 'Tu información y pagos están protegidos en todo momento.',
    },
    {
      icono: '📦',
      titulo: 'Gran variedad',
      descripcion: 'Encuentra todo lo que necesitas para el colegio y la oficina en un solo lugar.',
    },
  ];

  return (
    <>
      <Header />

      <div className="home-container">

        <section className="hero">
          <h1 className="hero-title">
            Todo lo que necesitas, en un solo lugar
          </h1>

          <p className="hero-description">
            Útiles escolares y de oficina al mejor precio, entregados en tu puerta.
          </p>

          {user ? (
            <div className="hero-actions">
              <p className="welcome-text">
                Hola, {user.name}. Rol: {user.role}
              </p>

              <Link
                className="hero-button"
                to={user.role === 'cliente' ? '/cliente' : '/admin'}
              >
                Ir a tu panel
              </Link>

              <button
                className="logout-button"
                onClick={logout}
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <Link className="hero-button" to="/Catalogo">
              Ver productos
            </Link>
          )}
        </section>

        <section className="section">
          <h2 className="section-title">
            Ofertas y promociones
          </h2>
          <p className="section-description">Aprovecha estos descuentos por tiempo limitado</p>

          <div className="cards-grid">
          {ofertas.map((prod) => (
            <div key={prod.nombre} className="card">
              <span className="badge">Oferta</span>

              <div className="icon">
                {prod.icono}
              </div>

              <h3>{prod.nombre}</h3>

              <p className="old-price">
                ${prod.precioAntes.toLocaleString()}
              </p>

              <p className="price">
                ${prod.precio.toLocaleString()}
              </p>
              <Link className="card-button" to="/catalogo">
              <button className="card-button">
                Ver producto
              </button>
              </Link>
            </div>
          ))}
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">
            Por qué elegirnos
          </h2>
          <p className="section-description">Estas son las razones por las que nuestros clientes nos prefieren</p>

          <div className="reasons-grid">
            {razones.map((r) => (
              <div key={r.titulo} className="reason-card">
                <div className="icon">
                  {r.icono}
                </div>

                <h3>{r.titulo}</h3>

                <p>{r.descripcion}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </>
  );
};

export default Home;