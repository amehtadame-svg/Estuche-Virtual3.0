import { productImage } from "../../lib/productImage";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Check,
  Heart,
  Search,
  ShoppingBag,
  Star,
} from "lucide-react";
import { API } from "../../api/api";
import { useCart } from "../../hooks/useCart";
import "./Catalog.css";

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  stock: number;
  category: { name: string } | null;
  images?: { url: string; isPrimary?: boolean }[];
}

const CAT_ALIASES: Record<string, string> = {
  escritura: "Escritura",
  cuadernos: "Cuadernos",
  arte: "Arte",
  mochilas: "Mochilas",
  oficina: "Oficina",
  planeacion: "Papeleria",
  planeación: "Papeleria",
  papeleria: "Papeleria",
  papelería: "Papeleria",
  tecnologia: "Tecnologia",
  tecnología: "Tecnologia",
};

const CAT_ORDER = [
  "Escritura",
  "Cuadernos",
  "Arte",
  "Mochilas",
  "Oficina",
  "Papeleria",
  "Tecnologia",
];

const DISPLAY_CAT: Record<string, string> = {
  Papeleria: "Planeación",
  Tecnologia: "Tecnología",
};

const OFFER_BY_NAME: Record<string, number> = {
  "Cuaderno cosido 100 hojas cuadriculado": 0.24,
  "Cuaderno argollado 80 hojas rayado": 0.18,
  "Cuaderno de dibujo 30 hojas": 0.24,
  "Grapadora metálica pequeña": 0.23,
  "Notas adhesivas 76 x 76 mm": 0.19,
  "Marcadores punta fina x12": 0.15,
};

const money = (value: number) => `$ ${Number(value).toLocaleString("es-CO")}`;

const catLabel = (name: string) => DISPLAY_CAT[name] ?? name;

export default function Catalog() {
  const { add } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("relevant");
  const [maxPrice, setMaxPrice] = useState(0);
  const [onlyOffers, setOnlyOffers] = useState(false);
  const [loved, setLoved] = useState<string[]>([]);
  const [toast, setToast] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const query = searchParams.get("buscar");
    if (query) setSearch(query);
    if (searchParams.get("oferta") === "1") setOnlyOffers(true);
  }, [searchParams]);

  useEffect(() => {
    fetch(API.products)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("Respuesta inválida");
        setProducts(data);
        const highest = data.reduce(
          (max: number, item: Product) => Math.max(max, Number(item.price) || 0),
          0,
        );
        setMaxPrice(highest || 0);
      })
      .catch((err) => setError(err.message ?? "Error al cargar productos"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!products.length) return;
    const raw = searchParams.get("cat");
    if (!raw) return;
    const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const names = products.map(item => item.category?.name).filter(Boolean) as string[];
    const mapped = names.find(name => normalize(name) === normalize(raw)) ?? CAT_ALIASES[raw.toLowerCase()] ?? raw;
    const match = products
      .map((item) => item.category?.name)
      .find((name) => name && normalize(name) === normalize(mapped));
    if (match) setActiveCategory(match);
  }, [products, searchParams]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const priceCeiling = useMemo(
    () =>
      products.reduce(
        (max, item) => Math.max(max, Number(item.price) || 0),
        0,
      ) || 100000,
    [products],
  );

  const priceFloor = useMemo(
    () =>
      products.reduce(
        (min, item) => Math.min(min, Number(item.price) || 0),
        priceCeiling,
      ) || 0,
    [products, priceCeiling],
  );

  const categories = useMemo(() => {
    const names = Array.from(
      new Set(products.map((item) => item.category?.name ?? "Otros")),
    );
    names.sort((a, b) => {
      const ia = CAT_ORDER.indexOf(a);
      const ib = CAT_ORDER.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
    return names;
  }, [products]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { Todos: products.length };
    products.forEach((item) => {
      const name = item.category?.name ?? "Otros";
      map[name] = (map[name] ?? 0) + 1;
    });
    return map;
  }, [products]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = products.filter((item) => {
      const cat = item.category?.name ?? "Otros";
      const matchCat = activeCategory === "Todos" || cat === activeCategory;
      const matchSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        catLabel(cat).toLowerCase().includes(query);
      const matchPrice = Number(item.price) <= maxPrice || maxPrice === 0;
      const matchOffer = !onlyOffers || Boolean(OFFER_BY_NAME[item.name]);
      return matchCat && matchSearch && matchPrice && matchOffer;
    });

    const copy = [...list];
    if (sort === "price-asc") copy.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sort === "price-desc")
      copy.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sort === "name")
      copy.sort((a, b) => a.name.localeCompare(b.name, "es"));
    return copy;
  }, [products, activeCategory, search, maxPrice, onlyOffers, sort]);

  const addProduct = async (item: Product) => {
    const saved = await add({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      category: item.category?.name ?? "Otros",
      icon: "📦",
      imageUrl: productImage(item),
    });
    if (saved) setToast({ id: item.id, name: item.name });
  };

  const clearFilters = () => {
    setActiveCategory("Todos");
    setSearch("");
    setSort("relevant");
    setOnlyOffers(false);
    setMaxPrice(priceCeiling);
    navigate("/catalogo");
  };

  return (
    <main className="catalog-page">
      <p className="catalog-crumb">
        <Link to="/">Inicio</Link>
        <span>/</span>
        <b>Catálogo</b>
      </p>

      <header className="catalog-hero">
        <div>
          <h1>
            Catálogo <em>completo</em>
          </h1>
          <p>
            {products.length} productos seleccionados a mano. Calidad
            garantizada y envío exprés.
          </p>
        </div>
      </header>

      <div className="catalog-layout">
        <aside className="catalog-sidebar">
          <label className="catalog-search">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar cuadernos, marcas"
            />
          </label>

          <label className="catalog-sort">
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="relevant">Más relevantes</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="name">Nombre A-Z</option>
            </select>
          </label>

          <div className="catalog-block">
            <h3>Categorías</h3>
            <ul className="catalog-cats">
              {["Todos", ...categories].map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    className={activeCategory === name ? "on" : ""}
                    onClick={() => setActiveCategory(name)}
                  >
                    <span>{name === "Todos" ? "Todas" : catLabel(name)}</span>
                    <i>{counts[name] ?? 0}</i>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="catalog-block">
            <h3>Precio máximo</h3>
            <input
              className="catalog-range"
              type="range"
              min={priceFloor}
              max={priceCeiling}
              step={100}
              value={maxPrice || priceCeiling}
              onChange={(event) => setMaxPrice(Number(event.target.value))}
            />
            <div className="catalog-price-row">
              <span>{money(priceFloor)}</span>
              <b>{money(maxPrice || priceCeiling)}</b>
            </div>
          </div>

          <label className="catalog-offers">
            <input
              type="checkbox"
              checked={onlyOffers}
              onChange={(event) => setOnlyOffers(event.target.checked)}
            />
            Solo ofertas
          </label>

          <button type="button" className="catalog-clear" onClick={clearFilters}>
            Limpiar filtros
          </button>
        </aside>

        <section className="catalog-main">
          <p className="catalog-count">
            {loading
              ? "Cargando productos..."
              : `${filtered.length} resultado${filtered.length === 1 ? "" : "s"}`}
          </p>

          {error ? (
            <div className="catalog-empty">
              <p>No se pudieron cargar los productos.</p>
              <small>{error}</small>
              <button type="button" onClick={() => window.location.reload()}>
                Reintentar
              </button>
            </div>
          ) : !loading && filtered.length === 0 ? (
            <div className="catalog-empty">
              <p>No hay productos con esos filtros.</p>
              <button type="button" onClick={clearFilters}>
                Ver todo el catálogo
              </button>
            </div>
          ) : (
            <div className="catalog-grid">
              {filtered.map((item) => {
                const src = productImage(item);
                const discount = OFFER_BY_NAME[item.name] ?? 0;
                const oldPrice = discount
                  ? Math.round(Number(item.price) / (1 - discount))
                  : null;
                const isLoved = loved.includes(item.id);
                const reviews = Math.max(24, item.stock * 4);
                const cat = item.category?.name ?? "Otros";

                return (
                  <article className="catalog-card" key={item.id}>
                    <div className="catalog-media">
                      <Link
                        to={`/producto/${item.id}`}
                        className="catalog-image"
                      >
                        {src ? (
                          <img src={src} alt={item.name} loading="lazy" />
                        ) : (
                          <span className="catalog-image-empty">Sin foto</span>
                        )}
                      </Link>
                      {discount > 0 && (
                        <span className="catalog-badge">
                          -{Math.round(discount * 100)}%
                        </span>
                      )}
                      {item.stock > 0 && item.stock <= 8 && (
                        <span className="catalog-stock">
                          ¡Quedan {item.stock}!
                        </span>
                      )}
                      <button
                        type="button"
                        className={`catalog-heart ${isLoved ? "on" : ""}`}
                        aria-label="Guardar"
                        onClick={() =>
                          setLoved((prev) =>
                            prev.includes(item.id)
                              ? prev.filter((id) => id !== item.id)
                              : [...prev, item.id],
                          )
                        }
                      >
                        <Heart
                          size={15}
                          fill={isLoved ? "#c026f5" : "none"}
                        />
                      </button>
                      <button
                        type="button"
                        className="catalog-add"
                        onClick={() => addProduct(item)}
                        disabled={item.stock === 0}
                      >
                        <ShoppingBag size={15} /> Agregar al carrito
                      </button>
                    </div>
                    <div className="catalog-content">
                      <p>
                        <span>{catLabel(cat)}</span>
                        <small>
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={index}
                              size={11}
                              fill="#f5c15d"
                              stroke="#f5c15d"
                            />
                          ))}
                          ({reviews})
                        </small>
                      </p>
                      <Link to={`/producto/${item.id}`}>
                        <h3>{item.name}</h3>
                      </Link>
                      <div className="catalog-price">
                        <b>{money(item.price)}</b>
                        {oldPrice ? <del>{money(oldPrice)}</del> : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {toast && (
        <div className="catalog-toast" role="status">
          <span>
            <Check size={16} />
          </span>
          <p>{toast.name}</p>
          <Link to="/carrito">Ver</Link>
        </div>
      )}
    </main>
  );
}
