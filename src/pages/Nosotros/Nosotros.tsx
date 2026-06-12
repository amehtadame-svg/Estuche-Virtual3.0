import { Link } from 'react-router-dom';
import Header from '../../components/Header/Header';
import './Nosotros.css';

export default function Nosotros() {
  const equipo = [
    { nombre: 'Ameht Adame', cargo: 'Backend', icono: '🤵', descripcion: 'Apasionado por la implementacion de nuevas tecnologias.' },
    { nombre: 'Frack Salamanca', cargo: 'Backend', icono: '🧑‍💻', descripcion: 'Administrador de ideas y caracterización.' },
    { nombre: 'Cristian Alvarado', cargo: 'Full stack', icono: '🧑‍💻', descripcion: 'Administrador de la gestion y logistica de la aplicación web.' },
    { nombre: 'Paula Garces', cargo: 'Frontend', icono: '👩‍🎤', descripcion: 'Encargada de los diseños y fotos de la aplicación web.' },
    { nombre: 'Isabella Olivares', cargo: 'Frontend', icono: '👩‍💻', descripcion: 'ilustradora diseño y colores.' },
  ];

  const valores = [
    { icono: '🌱', titulo: 'Sostenibilidad', descripcion: 'Trabajamos con proveedores responsables y materiales amigables con el medio ambiente.' },
    { icono: '🤝', titulo: 'Confianza', descripcion: 'Construimos relaciones duraderas con nuestros clientes basadas en la transparencia.' },
    { icono: '💡', titulo: 'Innovación', descripcion: 'Buscamos constantemente nuevas formas de mejorar tu experiencia de compra.' },
    { icono: '❤️', titulo: 'Comunidad', descripcion: 'Apoyamos a colegios y fundaciones con donaciones de útiles escolares.' },
  ];

  const hitos = [
    { año: '2019', texto: 'Fundación de Estuche Virtual en Bogotá con un pequeño catálogo de 50 productos.' },
    { año: '2020', texto: 'Lanzamiento de la tienda en línea. Primeros 50 pedidos en el primer mes.' },
    { año: '2022', texto: 'Expansión Más de 100 clientes satisfechos.' },
    { año: '2024', texto: 'Nueva plataforma digital y catálogo de más de 100 productos.' },
  ];

  return (
    <>
      <Header />
      <div className="nosotros-container">

        <section className="nosotros-hero">
          <h1 className="nosotros-hero-titulo">Somos Estuche Virtual</h1>
          <p className="nosotros-hero-texto">
            Nacimos con el objetivo de hacer más fácil el acceso a útiles escolares y de oficina de calidad,
            directamente a la puerta de tu hogar.
          </p>
        </section>

        <section className="nosotros-mision-vision">
          {[
            { titulo: '🎯 Nuestra misión', texto: 'Brindar a estudiantes, padres y profesionales una experiencia de compra ágil, confiable y asequible en útiles escolares y de oficina, con la mejor atención al cliente del mercado.' },
            { titulo: '🔭 Nuestra visión', texto: 'Convertirnos en la tienda en línea de útiles escolares más querida de Colombia, reconocida por su variedad, calidad y compromiso con la educación.' },
          ].map(item => (
            <div key={item.titulo} className="nosotros-card">
              <h2 className="nosotros-card-titulo">{item.titulo}</h2>
              <p className="nosotros-card-texto">{item.texto}</p>
            </div>
          ))}
        </section>

        <section className="nosotros-seccion">
          <h2 className="nosotros-seccion-titulo">Nuestros valores</h2>
          <p className="nosotros-seccion-subtitulo">Los principios que guían cada decisión que tomamos</p>
          <div className="nosotros-valores-grid">
            {valores.map(v => (
              <div key={v.titulo} className="nosotros-valor-card">
                <div className="nosotros-valor-icono">{v.icono}</div>
                <h3 className="nosotros-valor-titulo">{v.titulo}</h3>
                <p className="nosotros-valor-texto">{v.descripcion}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="nosotros-seccion">
          <h2 className="nosotros-seccion-titulo">Nuestra historia</h2>
          <p className="nosotros-seccion-subtitulo">Un recorrido de esfuerzo y crecimiento</p>
          <div className="nosotros-hitos">
            {hitos.map((hito, i) => (
              <div key={i} className="nosotros-hito">
                <div className="nosotros-hito-año">{hito.año}</div>
                <p className="nosotros-hito-texto">{hito.texto}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="nosotros-seccion">
          <h2 className="nosotros-seccion-titulo">Nuestro equipo</h2>
          <p className="nosotros-seccion-subtitulo">Las personas detrás de Estuche Virtual</p>
          <div className="nosotros-equipo-grid">
            {equipo.map(persona => (
              <div key={persona.nombre} className="nosotros-persona-card">
                <div className="nosotros-persona-avatar">{persona.icono}</div>
                <h3 className="nosotros-persona-nombre">{persona.nombre}</h3>
                <p className="nosotros-persona-cargo">{persona.cargo}</p>
                <p className="nosotros-persona-desc">{persona.descripcion}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="nosotros-cta">
          <h2 className="nosotros-cta-titulo">¿Listo para comprar?</h2>
          <p className="nosotros-cta-texto">Explora nuestro catálogo y encuentra todo lo que necesitas.</p>
          <div className="nosotros-cta-botones">
            <Link to="/catalogo" className="nosotros-btn-primario">Ver productos</Link>
            <Link to="/contacto" className="nosotros-btn-secundario">Contáctanos</Link>
          </div>
        </section>

      </div>
    </>
  );
}