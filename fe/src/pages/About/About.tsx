import { Link } from "react-router-dom";
import {
  Award,
  CheckCircle2,
  Heart,
  Leaf,
  Package,
  Sparkles,
} from "lucide-react";
import "./About.css";

const STORY_IMG =
  "https://images.pexels.com/photos/4473871/pexels-photo-4473871.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=900";

const values = [
  {
    icon: CheckCircle2,
    title: "Calidad curada",
    text: "Probamos cada referencia antes de publicarla. Si no la usaríamos nosotros, no la vendemos.",
  },
  {
    icon: Sparkles,
    title: "Diseño que inspira",
    text: "Creemos que un escritorio bonito produce ideas bonitas. La estética importa.",
  },
  {
    icon: Heart,
    title: "Cercanía real",
    text: "Soporte humano en minutos y una comunidad que crece por recomendación, no por anuncios.",
  },
  {
    icon: Leaf,
    title: "Sostenibilidad",
    text: "Empaques 100% reciclables y alianzas con papeleras de fibra certificada.",
  },
];

const path = [
  {
    year: "2019",
    title: "Nace Estuche Virtual",
    text: "Un emprendimiento universitario con 30 referencias y un portátil prestado.",
  },
  {
    year: "2021",
    title: "5.000 clientes",
    text: "Abrimos bodega propia y lanzamos envíos en 24 h en Bogotá.",
  },
  {
    year: "2023",
    title: "Primera vitrina física",
    text: "Chapinero nos recibe: experiencia de tienda + recogida en punto.",
  },
  {
    year: "2025",
    title: "32 ciudades",
    text: "Cobertura nacional exprés y más de 480 referencias curadas.",
  },
];

const team = [
  {
    initials: "CA",
    name: "Cristian Alvarado",
    role: "Líder · Full Stack",
  },
  {
    initials: "FS",
    name: "Frack Salamanca",
    role: "Backend",
  },
  {
    initials: "AA",
    name: "Ameth Adame",
    role: "Full Stack",
  },
  {
    initials: "PG",
    name: "Paula Garcés",
    role: "Frontend",
  },
];

export default function About() {
  return (
    <main className="about-page">
      <section className="about-hero">
        <p className="about-pill">
          <Sparkles size={14} /> Nuestra historia
        </p>
        <h1>
          Hacemos papelería que
          <br />
          da <em>ganas de crear</em>
        </h1>
        <p className="about-lead">
          Desde 2019 seleccionamos a mano cada cuaderno, marcador y mochila que
          vendemos. Somos una tienda colombiana obsesionada con el detalle.
        </p>
      </section>

      <section className="about-story">
        <div className="about-story-media">
          <span className="about-chip">Tienda destacada 2025</span>
          <img src={STORY_IMG} alt="Escritorio Estuche Virtual" />
          <div className="about-years">
            <b>7 años</b>
            <span>creando junto a ustedes</span>
          </div>
        </div>
        <div className="about-story-copy">
          <h2>
            De un maletín prestado a <em>32 ciudades</em>
          </h2>
          <p>
            Estuche Virtual nació en una habitación universitaria, repartiendo
            cuadernos en bicicleta entre clases. Encontramos algo simple: la
            gente ama la papelería bonita, pero comprarla en línea era lento,
            frío y genérico.
          </p>
          <p>
            Hoy somos un equipo de 4 personas, una bodega llena de color y una
            comunidad de más de 15.000 clientes que confían en nuestra
            curaduría. Seguimos empacando cada pedido como si fuera un regalo —
            porque para nosotros lo es.
          </p>
          <div className="about-mini-stats">
            <article>
              <Package size={16} />
              <div>
                <b>12.400+</b>
                <span>pedidos entregados</span>
              </div>
            </article>
            <article>
              <Heart size={16} />
              <div>
                <b>98%</b>
                <span>volverían a comprar</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="about-values">
        <p className="about-pill">
          <span /> Lo que nos mueve
        </p>
        <h2>
          Nuestros <em>valores</em>
        </h2>
        <p className="about-lead">
          Cuatro principios que no negociamos, ni en el pedido más pequeño.
        </p>
        <div className="about-values-grid">
          {values.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title}>
                <span>
                  <Icon size={18} />
                </span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="about-bottom">
        <div>
          <p className="about-pill">
            <span /> El camino
          </p>
          <h2>
            Nuestra <em>trayectoria</em>
          </h2>
          <ol>
            {path.map((item) => (
              <li key={item.year}>
                <b>{item.year}</b>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <p className="about-pill">
            <span /> Las personas
          </p>
          <h2>
            El <em>equipo</em>
          </h2>
          <div className="about-team">
            {team.map((person) => (
              <article key={person.name}>
                <span>{person.initials}</span>
                <div>
                  <strong>{person.name}</strong>
                  <p>{person.role}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-cta">
        <Award size={18} />
        <h2>¿Listo para crear con nosotros?</h2>
        <Link to="/catalogo">Ver el catálogo</Link>
      </section>
    </main>
  );
}
