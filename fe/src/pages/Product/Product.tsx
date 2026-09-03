import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import { useCart } from "../../hooks/useCart";
import { API } from "../../api/api";
import "./Product.css";

const productImagesByName: Record<string, string> = {
  "Cuaderno cosido 100 hojas cuadriculado":
    "https://i.postimg.cc/G2MxjsGC/cuaderno-cosido-100-hojas-cuadriculado.webp",
  "Cuaderno argollado 80 hojas rayado":
    "https://i.postimg.cc/6Q5QsHy3/cuaderno-argollado-80-hojas-rayado.webp",
  "Cuaderno de dibujo 30 hojas":
    "https://i.postimg.cc/BQ049hVR/cuaderno-de-dibujo-3o-hojas.webp",
  "Lápiz negro HB No. 2": "https://i.postimg.cc/nhSyzT3L/lapiz-HB-No-27.webp",
  "Lapicero azul punta fina":
    "https://i.postimg.cc/fRyP6mMS/lapicero-azul-punta-fina.webp",
  "Corrector líquido 7 ml":
    "https://i.postimg.cc/Qt30xTZQ/corector-liquido-7-ml.webp",
  "Marcadores punta fina x12":
    "https://i.postimg.cc/G2Dtz44F/marcadores-punta-fina-x12.webp",
  "Colores largos x12": "https://i.postimg.cc/fRkwBVFk/colores-por-12.webp",
  "Temperas escolares x6":
    "https://i.postimg.cc/GpGn5GjR/temperas-escolares-x6.webp",
  "Resma papel carta x500 hojas":
    "https://i.postimg.cc/N0wzLV1c/resma-papel-carta-x500-hojas.webp",
  "Cartulina plana tamaño pliego":
    "https://i.postimg.cc/85YdfJqt/pliego-de-carulina.webp",
  "Pegante líquido escolar 125 g":
    "https://i.postimg.cc/vTQ1BQmP/pegamento-escolar.webp",
  "Tijeras escolares punta roma":
    "https://i.postimg.cc/Wby3Rm0G/tijeras-punta-roma.webp",
  "Grapadora metálica pequeña":
    "https://i.postimg.cc/zGBqfyFq/grapadora-pequena.jpg",
  "Notas adhesivas 76 x 76 mm":
    "https://i.postimg.cc/7ZPpNj5c/notas-adhesivas.webp",
  "Morral escolar básico azul":
    "https://i.postimg.cc/2S5KWvJk/morral-escolar-basico-azul.webp",
  "Cartuchera doble compartimento":
    "https://i.postimg.cc/D02gT3kY/cartuchera-dos-compartimentos.webp",
  "Memoria USB 32 GB": "https://i.postimg.cc/50pz8HT5/memoria-usb-32-GB.webp",
  "Calculadora científica básica":
    "https://i.postimg.cc/HLYsXSgh/calculadora-cientifica-basica.webp",
};

const FALLBACK_IMG: Record<string, string> = {
  Cuadernos:
    "https://images.pexels.com/photos/5208300/pexels-photo-5208300.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=800&w=800",
  Escritura:
    "https://images.pexels.com/photos/34199486/pexels-photo-34199486.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=800&w=800",
  Arte: "https://images.pexels.com/photos/33889910/pexels-photo-33889910.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=800&w=800",
  Mochilas:
    "https://images.pexels.com/photos/3731256/pexels-photo-3731256.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=800&w=800",
  Oficina:
    "https://images.pexels.com/photos/8099500/pexels-photo-8099500.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=800&w=800",
  Papeleria:
    "https://images.pexels.com/photos/19797277/pexels-photo-19797277.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=800&w=800",
  Tecnologia:
    "https://images.pexels.com/photos/8099491/pexels-photo-8099491.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=800&w=800",
};

const OFFER_BY_NAME: Record<string, number> = {
  "Cuaderno cosido 100 hojas cuadriculado": 0.24,
  "Cuaderno argollado 80 hojas rayado": 0.18,
  "Cuaderno de dibujo 30 hojas": 0.24,
  "Grapadora metálica pequeña": 0.23,
  "Notas adhesivas 76 x 76 mm": 0.19,
  "Marcadores punta fina x12": 0.15,
};

const DISPLAY_CAT: Record<string, string> = {
  Papeleria: "Planeación",
  Tecnologia: "Tecnología",
};

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  stock: number;
  category: { name: string } | null;
  images?: { url: string; isPrimary?: boolean }[];
}

const money = (value: number) => `$ ${Number(value).toLocaleString("es-CO")}`;

const productImage = (item: Product) =>
  item.images?.find((image) => image.isPrimary)?.url ??
  item.images?.[0]?.url ??
  productImagesByName[item.name] ??
  FALLBACK_IMG[item.category?.name ?? ""] ??
  null;

export default function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add, items } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [openPanel, setOpenPanel] = useState<"desc" | "ship" | "warranty">(
    "desc",
  );

  useEffect(() => {
    setLoading(true);
    setQuantity(1);
    fetch(API.products)
      .then((response) => response.json())
      .then((data: Product[]) => {
        if (!Array.isArray(data)) return;
        const found = data.find((item) => item.id === id) ?? null;
        setProduct(found);
        if (found) {
          const same = data.filter(
            (item) =>
              item.id !== found.id &&
              (item.category?.name ?? "") === (found.category?.name ?? ""),
          );
          const extras = data.filter(
            (item) =>
              item.id !== found.id &&
              !same.some((other) => other.id === item.id),
          );
          setRelated([...same, ...extras].slice(0, 4));
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="pd-empty">
        <p>Cargando producto...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pd-empty">
        <p>Producto no encontrado.</p>
        <button type="button" onClick={() => navigate("/catalogo")}>
          Volver al catálogo
        </button>
      </div>
    );
  }

  const catName = product.category?.name ?? "Otros";
  const catLabel = DISPLAY_CAT[catName] ?? catName;
  const discount = OFFER_BY_NAME[product.name] ?? 0;
  const oldPrice = discount
    ? Math.round(Number(product.price) / (1 - discount))
    : null;
  const saved = oldPrice ? oldPrice - Number(product.price) : 0;
  const inCart = items.find((item) => item.id === product.id)?.quantity ?? 0;
  const image = productImage(product);

  const handleAdd = (goCheckout = false) => {
    for (let i = 0; i < quantity; i += 1) {
      add({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        category: catName,
        icon: "📦",
      });
    }
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
    if (goCheckout) navigate("/carrito");
  };

  const panels = [
    {
      id: "desc" as const,
      title: "Descripción completa",
      text:
        product.description ||
        `${product.name}. Elaborado con materiales de primera calidad y verificado por nuestro equipo antes del despacho.`,
    },
    {
      id: "ship" as const,
      title: "Envíos y entregas",
      text: "Despacho en 24–48 h en ciudades principales. Envío gratis en pedidos superiores a $120.000. Recibes seguimiento del paquete en todo momento.",
    },
    {
      id: "warranty" as const,
      title: "Garantía y devoluciones",
      text: "Tienes 30 días para devolverlo sin costo. Si llega dañado o no es lo que pediste, te lo reponemos o te devolvemos el dinero.",
    },
  ];

  return (
    <main className="pd-page">
      <p className="pd-crumb">
        <Link to="/">Inicio</Link>
        <span>›</span>
        <Link to="/catalogo">Catálogo</Link>
        <span>›</span>
        <Link to={`/catalogo?cat=${encodeURIComponent(catName)}`}>
          {catLabel}
        </Link>
        <span>›</span>
        <b>{product.name}</b>
      </p>

      <section className="pd-grid">
        <div className="pd-gallery">
          <div className="pd-main">
            {discount > 0 && (
              <span className="pd-badge">
                -{Math.round(discount * 100)}% hoy
              </span>
            )}
            {image ? (
              <img src={image} alt={product.name} />
            ) : (
              <div className="pd-main-empty">Sin imagen</div>
            )}
          </div>
        </div>

        <div className="pd-info">
          <p className="pd-cat">{catLabel}</p>
          <h1>{product.name}</h1>
          <p className="pd-rating">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} size={14} fill="#f5c15d" stroke="#f5c15d" />
            ))}
            <b>4.8</b>
            <span>· {Math.max(24, product.stock * 4)} reseñas verificadas</span>
          </p>
          <div className="pd-price">
            <strong>{money(product.price)}</strong>
            {oldPrice && <del>{money(oldPrice)}</del>}
            {saved > 0 && <em>Ahorras {money(saved)}</em>}
          </div>
          <p className="pd-desc">
            {product.description ||
              "Seleccionado a mano para estudio, arte y oficina. Materiales de primera calidad."}
          </p>
          <p className={product.stock > 0 ? "pd-stock ok" : "pd-stock no"}>
            {product.stock > 0
              ? `En stock — listo para envío (${product.stock} uds)`
              : "Sin stock"}
          </p>

          <div className="pd-actions">
            <div className="pd-qty">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                disabled={quantity <= 1}
              >
                <Minus size={14} />
              </button>
              <span>{quantity}</span>
              <button
                type="button"
                onClick={() =>
                  setQuantity((value) =>
                    Math.min(Math.max(product.stock, 1), value + 1),
                  )
                }
                disabled={quantity >= product.stock}
              >
                <Plus size={14} />
              </button>
            </div>
            <button
              type="button"
              className="pd-add"
              onClick={() => handleAdd(false)}
              disabled={product.stock === 0}
            >
              <ShoppingBag size={16} />
              {added ? "Agregado" : "Agregar al carrito"}
            </button>
            <button
              type="button"
              className="pd-buy"
              onClick={() => handleAdd(true)}
              disabled={product.stock === 0}
            >
              <Sparkles size={16} /> Comprar ya
            </button>
          </div>
          {inCart > 0 && <p className="pd-incart">{inCart} en tu carrito</p>}

          <div className="pd-perks">
            <article>
              <Truck size={18} />
              <div>
                <b>Envío 24–48 h</b>
                <span>Gratis +$120.000</span>
              </div>
            </article>
            <article>
              <RotateCcw size={18} />
              <div>
                <b>30 días</b>
                <span>Devolución gratis</span>
              </div>
            </article>
            <article>
              <ShieldCheck size={18} />
              <div>
                <b>Garantía</b>
                <span>Compra protegida</span>
              </div>
            </article>
          </div>

          <div className="pd-fold">
            {panels.map((panel) => (
              <div
                key={panel.id}
                className={openPanel === panel.id ? "open" : ""}
              >
                <button
                  type="button"
                  onClick={() => setOpenPanel(panel.id)}
                >
                  {panel.title}
                  <span>{openPanel === panel.id ? "˄" : "˅"}</span>
                </button>
                {openPanel === panel.id && <p>{panel.text}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="pd-related">
          <h2>
            También te puede <em>gustar</em>
          </h2>
          <div>
            {related.map((item) => {
              const src = productImage(item);
              const off = OFFER_BY_NAME[item.name];
              return (
                <Link key={item.id} to={`/producto/${item.id}`}>
                  <span className="pd-related-media">
                    {src ? <img src={src} alt={item.name} /> : null}
                    {off ? <i>-{Math.round(off * 100)}%</i> : null}
                  </span>
                  <small>
                    {DISPLAY_CAT[item.category?.name ?? ""] ??
                      item.category?.name}
                  </small>
                  <b>{item.name}</b>
                  <span>{money(item.price)}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
