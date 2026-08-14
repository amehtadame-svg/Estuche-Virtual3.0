import { Link } from 'react-router-dom';
import './About.css';

export default function About() {
  const team = [
    { name: 'Ameht Adame', role: 'Backend', icon: '🤵', description: 'Apasionado por la implementacion de nuevas tecnologias.' },
    { name: 'Frack Salamanca', role: 'Backend', icon: '🧑‍💻', description: 'Administrador de ideas y caracterización.' },
    { name: 'Cristian Alvarado', role: 'Full stack', icon: '🧑‍💻', description: 'Administrador de la gestion y logistica de la aplicación web.' },
    { name: 'Paula Garces', role: 'Frontend', icon: '👩‍🎤', description: 'Encargada de los diseños y fotos de la aplicación web.' },
  ];

  const values = [
    { icon: '🌱', title: 'Sostenibilidad', description: 'Trabajamos con proveedores responsables y materiales amigables con el medio ambiente.' },
    { icon: '🤝', title: 'Confianza', description: 'Construimos relaciones duraderas con nuestros clientes basadas en la transparencia.' },
    { icon: '💡', title: 'Innovación', description: 'Buscamos constantemente nuevas formas de mejorar tu experiencia de compra.' },
    { icon: '❤️', title: 'Comunidad', description: 'Apoyamos a colegios y fundaciones con donaciones de útiles escolares.' },
  ];

  const milestones = [
    { year: '2019', text: 'Fundación de Estuche Virtual en Bogotá con un pequeño catálogo de 50 productos.' },
    { year: '2020', text: 'Lanzamiento de la tienda en línea. Primeros 50 pedidos en el primer mes.' },
    { year: '2022', text: 'Expansión Más de 100 clientes satisfechos.' },
    { year: '2024', text: 'Nueva plataforma digital y catálogo de más de 100 productos.' },
  ];

  return (
    <div className="nosotros-container">
      <section className="nosotros-hero">
        <h1 className="nosotros-hero-titulo">Somos Estuche Virtual</h1>
        <p className="nosotros-hero-texto">
          Nacimos con el objetivo de hacer más fácil el acceso a útiles escolares y de oficina de calidad, directamente a la puerta de tu hogar.
        </p>
      </section>

      <section className="nosotros-mision-vision">
        {[
          { title: '🎯 Nuestra misión', text: 'Brindar a estudiantes, padres y profesionales una experiencia de compra ágil, confiable y asequible en útiles escolares y de oficina, con la mejor atención al cliente del mercado.' },
          { title: '🔭 Nuestra visión', text: 'Convertirnos en la tienda en línea de útiles escolares más querida de Colombia, reconocida por su variedad, calidad y compromiso con la educación.' },
        ].map((item) => (
          <div key={item.title} className="nosotros-card">
            <h2 className="nosotros-card-titulo">{item.title}</h2>
            <p className="nosotros-card-texto">{item.text}</p>
          </div>
        ))}
      </section>

      <section className="nosotros-seccion">
        <h2 className="nosotros-seccion-titulo">Nuestros valores</h2>
        <p className="nosotros-seccion-subtitulo">Los principios que guían cada decisión que tomamos</p>
        <div className="nosotros-valores-grid">
          {values.map((v) => (
            <div key={v.title} className="nosotros-valor-card">
              <div className="nosotros-valor-icono">{v.icon}</div>
              <h3 className="nosotros-valor-titulo">{v.title}</h3>
              <p className="nosotros-valor-texto">{v.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="nosotros-seccion">
        <h2 className="nosotros-seccion-titulo">Nuestra historia</h2>
        <p className="nosotros-seccion-subtitulo">Un recorrido de esfuerzo y crecimiento</p>
        <div className="nosotros-hitos">
          {milestones.map((milestone, i) => (
            <div key={i} className="nosotros-hito">
              <div className="nosotros-hito-año">{milestone.year}</div>
              <p className="nosotros-hito-texto">{milestone.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="nosotros-seccion">
        <h2 className="nosotros-seccion-titulo">Nuestro equipo</h2>
        <p className="nosotros-seccion-subtitulo">Las personas detrás de Estuche Virtual</p>
        <div className="nosotros-equipo-grid">
          {team.map((person) => (
            <div key={person.name} className="nosotros-persona-card">
              <div className="nosotros-persona-avatar">{person.icon}</div>
              <h3 className="nosotros-persona-nombre">{person.name}</h3>
              <p className="nosotros-persona-cargo">{person.role}</p>
              <p className="nosotros-persona-desc">{person.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="nosotros-cta">
        <h2 className="nosotros-cta-titulo">¿Listo para comprar?</h2>
        <p className="nosotros-cta-texto">Explora nuestro catálogo y encuentra todo lo que necesitas.</p>
        <div className="nosotros-cta-botones">
          <Link to="/catalogo" className="nosotros-btn-primario">
            Ver productos
          </Link>
          <Link to="/contacto" className="nosotros-btn-secundario">
            Contáctanos
          </Link>
        </div>
      </section>
    </div>
  );
}
