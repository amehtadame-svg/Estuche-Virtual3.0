import { Link } from "react-router-dom";
import { ArrowRight, Check, ShieldCheck, Star, Truck } from "lucide-react";
import { useCart } from "../../hooks/useCart";
import "./Home.css";

const categories = [
  ["Escritura", "https://i.postimg.cc/fW09PXfV/utiles-de-escritura.webp"],
  ["Cuadernos", "https://i.postimg.cc/MKkXcpfM/cuadernos.webp"],
  ["Arte", "https://i.postimg.cc/rpqrDF36/arte.webp"],
  ["Oficina", "https://i.postimg.cc/D0GrqpcQ/oficina.webp"],
];

const products = [
  {
    id: "1",
    name: "Cuaderno Espiral Aurora 100h",
    price: 18900,
    old: 24900,
    image: "https://i.postimg.cc/RFB4SNDT/cuaderno-espiral.webp",
    category: "cuadernos",
    badge: "-24%",
  },
  {
    id: "2",
    name: "Planner Pastel Organízate 2026",
    price: 32900,
    image: "https://i.postimg.cc/YC6Xc0YN/planner-2026.webp",
    category: "planeación",
    badge: "Nuevo",
  },
  {
    id: "3",
    name: "Set de Escritorio Minimal",
    price: 45900,
    old: 59900,
    image: "https://i.postimg.cc/kgqHgWJM/set-escritorio.webp",
    category: "oficina",
    badge: "-23%",
  },
  {
    id: "5",
    name: "Marcadores Arte Doble Punta",
    price: 54900,
    image: "https://i.postimg.cc/FHrP4mpH/marcadores-arte.webp",
    category: "arte",
    badge: "Nuevo",
  },
];

export default function Home() {
  const { add } = useCart();
  return (
    <main className="arena-home">
      <section className="arena-hero">
        <div className="hero-copy">
          <p className="hero-pill">
            ✦ Nueva colección 2026 · Envíos el mismo día
          </p>
          <h1>
            Todo lo que
            <br />
            necesitas,
            <br />
            <em>en un solo</em> lugar.
          </h1>
          <span className="hero-stroke" />
          <p className="hero-description">
            Papelería, arte y oficina con curaduría premium. Más de 480
            referencias seleccionadas una por una, entregadas en la puerta de tu
            casa en 24 horas.
          </p>
          <div className="hero-buttons">
            <Link to="/catalogo" className="hero-primary">
              Explorar catálogo <ArrowRight size={18} />
            </Link>
            <Link to="/catalogo" className="hero-secondary">
              Ofertas del mes
            </Link>
          </div>
          <div className="hero-stats">
            <div>
              <b>12.876+</b>
              <span>Clientes felices</span>
            </div>
            <div>
              <b>412+</b>
              <span>Productos curados</span>
            </div>
            <div>
              <b>84%</b>
              <span>Recomendación</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <img src="/design/hero-stationery.webp" alt="Papelería premium" />
          <div className="hero-product-float">
            <img src="/design/category-notebooks.webp" alt="" />
            <div>
              <b>Cuaderno Espiral</b>
              <span>
                $ 18.900 <i>-24%</i>
              </span>
            </div>
          </div>
        </div>
      </section>
      <section className="trust-row">
        <span>
          <Truck size={18} /> Envío en <b>24 h</b>
        </span>
        <span>Bogotá · Medellín · Cali</span>
        <span>
          <Star size={17} /> <b>4.9/5</b> · 2.314 reseñas
        </span>
      </section>
      <section className="home-section">
        <p className="eyebrow">Explora</p>
        <div className="section-head">
          <div>
            <h2>
              Compra por <em>categoría</em>
            </h2>
            <p>
              Seis universos organizados para que encuentres exactamente lo que
              buscas.
            </p>
          </div>
          <Link to="/catalogo">
            Ver todo el catálogo <ArrowRight size={16} />
          </Link>
        </div>
        <div className="category-grid">
          {categories.map(([name, image]) => (
            <Link key={name} to="/catalogo" className="category-card">
              <img src={image} alt={name} />
              <div>
                <b>{name}</b>
                <span>
                  Ver productos <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="home-section">
        <p className="eyebrow">Selección</p>
        <div className="section-head">
          <div>
            <h2>
              Lo más <em>buscado</em>
            </h2>
            <p>Los favoritos de nuestra comunidad, actualizados cada semana.</p>
          </div>
          <div className="product-tabs">
            <button className="active">Destacados</button>
            <button>Ofertas</button>
            <button>Nuevos</button>
          </div>
        </div>
        <div className="arena-products">
          {products.map((p) => (
            <article className="arena-product" key={p.id}>
              <Link to={`/producto/${p.id}`} className="product-image">
                <img src={p.image} alt={p.name} />
                <span>{p.badge}</span>
              </Link>
              <div className="product-content">
                <p>
                  {p.category} <small>★ 4.9</small>
                </p>
                <Link to={`/producto/${p.id}`}>
                  <h3>{p.name}</h3>
                </Link>
                <div>
                  <b>${p.price.toLocaleString("es-CO")}</b>
                  {p.old && <del>${p.old.toLocaleString("es-CO")}</del>}
                </div>
                <button
                  onClick={() =>
                    add({
                      id: p.id,
                      name: p.name,
                      price: p.price,
                      category: p.category,
                      icon: "📦",
                    })
                  }
                >
                  Agregar al carrito
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="school-banner">
        <div>
          <p className="eyebrow">Temporada escolar</p>
          <h2>
            Regreso a clases 2026:
            <br />
            <em>hasta 40% dcto.</em>
          </h2>
          <p>
            Kits completos armados por expertos. Compra una sola lista, recibe
            un solo paquete.
          </p>
          <Link to="/catalogo">
            Comprar la colección <ArrowRight size={17} />
          </Link>
        </div>
        <img src="/design/category-art.webp" alt="Colección escolar" />
      </section>
      <section className="home-section experience">
        <p className="eyebrow">La experiencia</p>
        <h2>
          Comprar aquí se siente <em>diferente</em>
        </h2>
        <div className="benefits">
          <article>
            <Truck />
            <h3>Envío exprés 24–48 h</h3>
            <p>Cobertura nacional con seguimiento en tiempo real.</p>
          </article>
          <article>
            <ShieldCheck />
            <h3>Compra protegida</h3>
            <p>Pagos cifrados y garantía total.</p>
          </article>
          <article>
            <Check />
            <h3>Devoluciones 30 días</h3>
            <p>Lo recogemos sin costo y sin preguntas.</p>
          </article>
        </div>
      </section>
    </main>
  );
}