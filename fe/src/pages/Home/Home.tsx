import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Heart,
  RotateCcw,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import { API } from "../../api/api";
import { useCart } from "../../hooks/useCart";
import "./Home.css";

interface ApiProduct {
  id: string;
  name: string;
  price: number;
  description: string | null;
  stock: number;
  category: { name: string } | null;
  images?: { url: string; isPrimary?: boolean }[];
}

const IMG = {
  hero: "https://images.pexels.com/photos/5208299/pexels-photo-5208299.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=900",
  writing:
    "https://images.pexels.com/photos/34199486/pexels-photo-34199486.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=700&w=700",
  notebooks:
    "https://images.pexels.com/photos/5208300/pexels-photo-5208300.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=700&w=700",
  art: "https://images.pexels.com/photos/33889910/pexels-photo-33889910.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=700&w=700",
  backpacks:
    "https://images.pexels.com/photos/3731256/pexels-photo-3731256.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=700&w=700",
  office:
    "https://images.pexels.com/photos/8099500/pexels-photo-8099500.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=700&w=700",
  planning:
    "https://images.pexels.com/photos/19797277/pexels-photo-19797277.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=700&w=700",
  markers:
    "https://images.pexels.com/photos/32324492/pexels-photo-32324492.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=700&w=700",
  school:
    "https://images.pexels.com/photos/5208348/pexels-photo-5208348.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=800&w=800",
};

const TESTIMONIALS = [
  {
    quote:
      "La curaduría de productos es otro nivel. Pedí el viernes y el lunes ya estaba ilustrando con mis marcadores nuevos.",
    name: "Valentina Ríos",
    role: "Diseñadora gráfica",
    initials: "VR",
  },
  {
    quote:
      "Compré todo el kit de regreso a clases en 10 minutos. Precios justos, empaque impecable y seguimiento en tiempo real.",
    name: "Julián Castro",
    role: "Estudiante de arquitectura",
    initials: "JC",
  },
  {
    quote:
      "El planner pastel es hermoso y el soporte respondió en minutos. Se nota que aman lo que hacen.",
    name: "Mariana Lozada",
    role: "Docente",
    initials: "ML",
  },
];

function useCountUp(target: number, active: boolean, duration = 1600) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - started) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, duration, target]);
  return value;
}

const CATEGORY_CARDS = [
  { label: "Escritura", dbName: "Escritura", image: IMG.writing },
  { label: "Cuadernos", dbName: "Cuadernos", image: IMG.notebooks },
  { label: "Arte", dbName: "Arte", image: IMG.art },
  { label: "Mochilas", dbName: "Mochilas", image: IMG.backpacks },
  { label: "Oficina", dbName: "Oficina", image: IMG.office },
  { label: "Planeación", dbName: "Papeleria", image: IMG.planning },
];

const SHOWCASE_GUIDE = [
  {
    dbName: "Cuadernos",
    label: "CUADERNOS",
    image: IMG.notebooks,
    badge: "-24%",
    discount: 0.24,
    reviews: 214,
  },
  {
    dbName: "Papeleria",
    label: "PLANEACION",
    image: IMG.planning,
    badge: "NUEVO",
    discount: 0,
    reviews: 168,
  },
  {
    dbName: "Oficina",
    label: "OFICINA",
    image: IMG.office,
    badge: "-23%",
    discount: 0.23,
    reviews: 96,
  },
  {
    dbName: "Arte",
    label: "ARTE",
    image: IMG.markers,
    badge: "NUEVO",
    discount: 0,
    reviews: 142,
  },
];

const money = (value: number) => `$ ${Number(value).toLocaleString("es-CO")}`;

const apiImage = (product?: ApiProduct | null) =>
  product?.images?.find((image) => image.isPrimary)?.url ??
  product?.images?.[0]?.url ??
  null;

export default function Home() {
  const { add } = useCart();
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [tab, setTab] = useState<"destacados" | "ofertas" | "nuevos">(
    "destacados",
  );
  const [loved, setLoved] = useState<string[]>([]);
  const [toast, setToast] = useState<{ id: string; name: string } | null>(null);
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  const [statsOn, setStatsOn] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const orders = useCountUp(12400, statsOn);
  const cities = useCountUp(32, statsOn);
  const reviewsN = useCountUp(4800, statsOn);
  const happyClients = useCountUp(15000, true);
  const curated = useCountUp(480, true);
  const recommend = useCountUp(98, true);

  useEffect(() => {
    fetch(API.products)
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const node = statsRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsOn(true);
      },
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach((product) => {
      const name = product.category?.name ?? "";
      map[name] = (map[name] ?? 0) + 1;
    });
    return map;
  }, [products]);

  const featured = useMemo(() => {
    const notebook = products.find((product) =>
      (product.category?.name ?? "").toLowerCase().includes("cuadern"),
    );
    return notebook ?? products[0] ?? null;
  }, [products]);

  const featuredHref = featured ? `/producto/${featured.id}` : "/catalogo";

  const showcase = useMemo(() => {
    const pool =
      tab === "ofertas"
        ? products.filter((_, index) => index % 2 === 0)
        : tab === "nuevos"
          ? [...products].reverse()
          : products;

    return SHOWCASE_GUIDE.map((guide, index) => {
      const match =
        pool.find((product) => product.category?.name === guide.dbName) ??
        pool[index] ??
        products[index] ??
        null;
      return { guide, product: match };
    }).filter((item) => item.product);
  }, [products, tab]);

  const addProduct = (product: ApiProduct) => {
    add({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      category: product.category?.name ?? "Otros",
      icon: "📦",
    });
    setToast({ id: product.id, name: product.name });
  };

  return (
    <main className="arena-home">
      <section className="arena-hero">
        <div className="hero-copy">
          <p className="hero-pill">
            <Sparkles size={14} />
            Nueva colección 2026 · Envíos el mismo día
          </p>
          <h1>
            Todo lo que
            <br />
            necesitas,
            <br />
            <em>en un solo</em> lugar.
          </h1>
          <p className="hero-description">
            Papelería, arte y oficina con curaduría premium. Más de 480
            referencias seleccionadas una por una, entregadas en la puerta de tu
            casa en 24 horas.
          </p>
          <div className="hero-buttons">
            <Link to="/catalogo" className="hero-primary">
              Explorar catálogo <ArrowRight size={18} />
            </Link>
            <Link to="/catalogo?oferta=1" className="hero-secondary">
              <Sparkles size={15} /> Ofertas del mes
            </Link>
          </div>
          <div className="hero-stats">
            <div>
              <b>{happyClients.toLocaleString("es-CO")}+</b>
              <span>Clientes felices</span>
            </div>
            <div>
              <b>{curated.toLocaleString("es-CO")}+</b>
              <span>Productos curados</span>
            </div>
            <div>
              <b>{recommend}%</b>
              <span>Recomendación</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-diamond" aria-hidden="true" />
          <div className="hero-glow" />
          <img src={IMG.hero} alt="Papelería premium en tonos lavanda" />
          <Link to={featuredHref} className="hero-product-float">
            <img src={apiImage(featured) ?? IMG.notebooks} alt="" />
            <div>
              <b>
                {featured
                  ? featured.name.length > 18
                    ? `${featured.name.slice(0, 16)}...`
                    : featured.name
                  : "Cuaderno Espiral ..."}
              </b>
              <span>
                {featured ? money(featured.price) : "$ 18.900"}
                <i>-24%</i>
              </span>
            </div>
          </Link>
          <Link to="/catalogo" className="hero-ship-float">
            <span className="hero-ship-icon">
              <Truck size={18} />
            </span>
            <div>
              <b>Envío en 24 h</b>
              <small>Bogotá · Medellín · Cali</small>
            </div>
          </Link>
          <div className="hero-rating-float">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} size={13} fill="#f5c15d" stroke="#f5c15d" />
            ))}
            <strong>4.9/5</strong>
            <span>· 2.314 reseñas</span>
          </div>
        </div>
      </section>

      <section className="home-section categories-section">
        <p className="eyebrow">
          <span /> Explora
        </p>
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
          <Link to="/catalogo" className="section-link">
            Ver todo el catálogo <ArrowRight size={16} />
          </Link>
        </div>
        <div className="category-grid">
          {CATEGORY_CARDS.map((category) => {
            const total = counts[category.dbName] ?? 0;
            return (
              <Link
                key={category.label}
                to={`/catalogo?cat=${encodeURIComponent(category.dbName)}`}
                className="category-card"
              >
                <img src={category.image} alt={category.label} />
                <div className="category-meta">
                  <div>
                    <b>{category.label}</b>
                    <span>
                      {total} producto{total === 1 ? "" : "s"}
                    </span>
                  </div>
                  <span className="category-arrow" aria-hidden="true">
                    <ArrowUpRight size={16} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="home-section">
        <p className="eyebrow">
          <span /> Selección
        </p>
        <div className="section-head">
          <div>
            <h2>
              Lo más <em>buscado</em>
            </h2>
            <p>Los favoritos de nuestra comunidad, actualizados cada semana.</p>
          </div>
          <div className="product-tabs">
            <button
              className={tab === "destacados" ? "active" : ""}
              onClick={() => setTab("destacados")}
            >
              Destacados
            </button>
            <button
              className={tab === "ofertas" ? "active" : ""}
              onClick={() => setTab("ofertas")}
            >
              Ofertas
            </button>
            <button
              className={tab === "nuevos" ? "active" : ""}
              onClick={() => setTab("nuevos")}
            >
              Nuevos
            </button>
          </div>
        </div>
        <div className="arena-products">
          {showcase.length === 0 ? (
            <p className="home-empty">
              Aún no hay productos en la base. Cuando el seed cargue, aparecerán
              aquí.
            </p>
          ) : (
            showcase.map(({ guide, product }) => {
              if (!product) return null;
              const oldPrice = guide.discount
                ? Math.round(Number(product.price) / (1 - guide.discount))
                : null;
              const isLoved = loved.includes(product.id);
              return (
                <article className="arena-product" key={product.id}>
                  <div className="product-media">
                    <Link
                      to={`/producto/${product.id}`}
                      className="product-image"
                    >
                      <img
                        src={apiImage(product) ?? guide.image}
                        alt={product.name}
                      />
                    </Link>
                    <span className="product-badge">{guide.badge}</span>
                    <button
                      type="button"
                      className={`product-heart ${isLoved ? "on" : ""}`}
                      aria-label="Guardar"
                      onClick={() =>
                        setLoved((prev) =>
                          prev.includes(product.id)
                            ? prev.filter((id) => id !== product.id)
                            : [...prev, product.id],
                        )
                      }
                    >
                      <Heart size={15} fill={isLoved ? "#c026f5" : "none"} />
                    </button>
                    <button
                      type="button"
                      className="product-add"
                      onClick={() => addProduct(product)}
                    >
                      <ShoppingBag size={15} /> Agregar al carrito
                    </button>
                  </div>
                  <div className="product-content">
                    <p>
                      <span>{guide.label}</span>
                      <small>
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            size={11}
                            fill="#f5c15d"
                            stroke="#f5c15d"
                          />
                        ))}
                        ({guide.reviews})
                      </small>
                    </p>
                    <Link to={`/producto/${product.id}`}>
                      <h3>{product.name}</h3>
                    </Link>
                    <div className="product-price">
                      <b>{money(product.price)}</b>
                      {oldPrice && <del>{money(oldPrice)}</del>}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="school-banner">
        <div className="school-copy">
          <p className="eyebrow">
            <Sparkles size={13} /> Temporada escolar
          </p>
          <h2>
            Regreso a clases 2026:
            <br />
            <em>hasta 40% dcto.</em>
          </h2>
          <p>
            Kits completos de cuadernos, escritura y arte armados por expertos.
            Compra una sola lista, recibe un solo paquete.
          </p>
          <div className="school-actions">
            <Link to="/catalogo?oferta=1" className="school-primary">
              Comprar la colección <ArrowRight size={17} />
            </Link>
            <Link to="/catalogo?cat=Arte" className="school-secondary">
              Ver arte y dibujo
            </Link>
          </div>
        </div>
        <div className="school-visual">
          <img src={IMG.school} alt="Colección escolar pastel" />
          <span className="school-badge">Envío gratis</span>
        </div>
      </section>

      <section className="home-section experience">
        <p className="eyebrow">
          <span /> La experiencia
        </p>
        <h2>
          Comprar aquí se siente <em>diferente</em>
        </h2>
        <p className="experience-lead">
          Cada detalle —del clic al empaque— está pensado para que vuelvas.
        </p>
        <div className="benefits">
          <article>
            <span className="benefit-icon">
              <Truck size={18} />
            </span>
            <h3>Envío exprés 24–48 h</h3>
            <p>
              Cobertura nacional con seguimiento en tiempo real y gratis desde
              $120.000.
            </p>
          </article>
          <article>
            <span className="benefit-icon">
              <ShieldCheck size={18} />
            </span>
            <h3>Compra protegida</h3>
            <p>
              Pagos cifrados y garantía total: si algo falla, te devolvemos el
              dinero.
            </p>
          </article>
          <article>
            <span className="benefit-icon">
              <RotateCcw size={18} />
            </span>
            <h3>Devoluciones 30 días</h3>
            <p>
              ¿No era lo que esperabas? Lo recogemos sin costo y sin preguntas
              incómodas.
            </p>
          </article>
          <article>
            <span className="benefit-icon">
              <Sparkles size={18} />
            </span>
            <h3>Soporte humano 24/7</h3>
            <p>
              Personas reales que aman la papelería y responden en minutos, no
              bots.
            </p>
          </article>
        </div>
        <div className="impact-banner" ref={statsRef}>
          <div>
            <b>{orders.toLocaleString("es-CO")}+</b>
            <span>Pedidos entregados en 2025</span>
          </div>
          <div>
            <b>{cities}</b>
            <span>Ciudades con envío en 24 h</span>
          </div>
          <div>
            <b>{reviewsN.toLocaleString("es-CO")}+</b>
            <span>Reseñas de 5 estrellas</span>
          </div>
        </div>
      </section>

      <section className="home-section community">
        <p className="eyebrow">
          <span /> Comunidad
        </p>
        <h2>
          Lo que dicen <em>nuestros clientes</em>
        </h2>
        <p className="experience-lead">
          Más de 15.000 personas ya hacen sus compras aquí cada mes.
        </p>
        <div className="testimonials">
          {TESTIMONIALS.map((item) => (
            <article key={item.name}>
              <span className="quote-mark">”</span>
              <p>“{item.quote}”</p>
              <div className="testimonial-user">
                <span>{item.initials}</span>
                <div>
                  <b>{item.name}</b>
                  <small>{item.role}</small>
                </div>
                <em>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      size={12}
                      fill="#f5c15d"
                      stroke="#f5c15d"
                    />
                  ))}
                </em>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="newsletter">
        <span className="newsletter-icon">
          <Send size={18} />
        </span>
        <h2>10% dcto. en tu primera compra</h2>
        <p>
          Únete al club y recibe el cupón <b>BIENVENIDA10</b> junto a novedades
          y lanzamientos.
        </p>
        <form
          className="newsletter-form"
          onSubmit={(event) => {
            event.preventDefault();
            const value = email.trim().toLowerCase();
            if (!value) return;
            const list = JSON.parse(
              localStorage.getItem("club-emails") || "[]",
            ) as string[];
            if (!list.includes(value)) {
              localStorage.setItem(
                "club-emails",
                JSON.stringify([...list, value]),
              );
            }
            localStorage.setItem("coupon-bienvenida", "BIENVENIDA10");
            setJoined(true);
          }}
        >
          <input
            type="email"
            required
            placeholder="tu@correo.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button type="submit">{joined ? "¡Listo!" : "Unirme"}</button>
        </form>
        {joined && (
          <p className="newsletter-ok">
            Cupón activado: <b>BIENVENIDA10</b> · 10% en tu primera compra.
          </p>
        )}
      </section>

      {toast && (
        <div className="cart-toast" role="status">
          <span className="cart-toast-check">
            <Check size={16} />
          </span>
          <p>{toast.name}</p>
          <Link to="/carrito">Ver</Link>
        </div>
      )}
    </main>
  );
}
