import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './Productos.css';

const productos = [
  { id: 1,  nombre: 'Cuaderno universitario',   precio: 8500,  categoria: 'Cuadernos',  icono: '📓', descripcion: 'Cuaderno de 100 hojas con pasta dura, ideal para apuntes universitarios. Papel cuadriculado de alta calidad.', stock: 50 },
  { id: 2,  nombre: 'Cuaderno cuadriculado',     precio: 7000,  categoria: 'Cuadernos',  icono: '📒', descripcion: 'Cuaderno cuadriculado de 80 hojas, perfecto para matemáticas y ciencias.', stock: 40 },
  { id: 3,  nombre: 'Set de colores x12',        precio: 12000, categoria: 'Colores',    icono: '🎨', descripcion: 'Set de 12 colores vibrantes con punta resistente, ideales para colorear y manualidades.', stock: 30 },
  { id: 4,  nombre: 'Colores acuarelables x24',  precio: 18500, categoria: 'Colores',    icono: '🖌️', descripcion: 'Set de 24 colores acuarelables de alta pigmentación, compatibles con técnicas de acuarela.', stock: 20 },
  { id: 5,  nombre: 'Carpeta argollada',         precio: 9500,  categoria: 'Carpetas',   icono: '📁', descripcion: 'Carpeta argollada tamaño carta con 3 argollas de 1 pulgada, tapa dura resistente.', stock: 40 },
  { id: 6,  nombre: 'Carpeta plástica A4',       precio: 4500,  categoria: 'Carpetas',   icono: '🗂️', descripcion: 'Carpeta plástica tamaño A4, liviana y resistente al agua. Disponible en varios colores.', stock: 60 },
  { id: 7,  nombre: 'Lapicero azul x10',         precio: 5000,  categoria: 'Lapiceros',  icono: '🖊️', descripcion: 'Paquete de 10 lapiceros de tinta azul de secado rápido, cómodo agarre ergonómico.', stock: 100 },
  { id: 8,  nombre: 'Lapicero negro x10',        precio: 5000,  categoria: 'Lapiceros',  icono: '✒️', descripcion: 'Paquete de 10 lapiceros de tinta negra permanente, ideales para documentos y firmas.', stock: 100 },
  { id: 9,  nombre: 'Mochila escolar',           precio: 45000, categoria: 'Mochilas',   icono: '🎒', descripcion: 'Mochila escolar con múltiples compartimentos, correas acolchadas y material impermeable. Capacidad 20L.', stock: 15 },
  { id: 10, nombre: 'Mochila ejecutiva',         precio: 65000, categoria: 'Mochilas',   icono: '💼', descripcion: 'Mochila ejecutiva con compartimento para portátil de hasta 15", diseño elegante y resistente.', stock: 10 },
  { id: 11, nombre: 'Tijeras punta redonda',     precio: 6500,  categoria: 'Tijeras',    icono: '✂️', descripcion: 'Tijeras con punta redonda de seguridad, ideales para niños. Hoja de acero inoxidable.', stock: 60 },
  { id: 12, nombre: 'Regla 30 cm',               precio: 2500,  categoria: 'Otros',      icono: '📏', descripcion: 'Regla plástica transparente de 30 cm con medidas en centímetros y pulgadas.', stock: 80 },
  { id: 13, nombre: 'Borrador blanco',           precio: 1500,  categoria: 'Otros',      icono: '🔲', descripcion: 'Borrador blanco suave que no daña el papel, borra limpio sin dejar residuos.', stock: 120 },
  { id: 14, nombre: 'Sacapuntas doble',          precio: 2000,  categoria: 'Otros',      icono: '🔧', descripcion: 'Sacapuntas con doble orificio para lápices estándar y jumbo, depósito transparente.', stock: 90 },
  { id: 15, nombre: 'Resaltadores x5',           precio: 8000,  categoria: 'Otros',      icono: '🖍️', descripcion: 'Set de 5 resaltadores en colores neón: amarillo, rosado, verde, naranja y azul. Punta biselada.', stock: 45 },
  { id: 16, nombre: 'Post-it colores x100',      precio: 9500,  categoria: 'Otros',      icono: '📌', descripcion: 'Block de 100 notas adhesivas en 4 colores pastel. Adhesivo reposicionable, no daña superficies.', stock: 55 },
];

export default function Producto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { agregar, items } = useCart();
  const [cantidad, setCantidad] = useState(1);
  const [agregado, setAgregado] = useState(false);

  const producto = productos.find((p) => p.id === Number(id));

  if (!producto) {
    return (
      <>
        <div className="prod-detalle-vacio">
          <p>Producto no encontrado.</p>
          <button onClick={() => navigate('/catalogo')}>Volver al catálogo</button>
        </div>
      </>
    );
  }

  const enCarrito = items.find((i) => i.id === producto.id)?.cantidad ?? 0;
  const relacionados = productos.filter((p) => p.categoria === producto.categoria && p.id !== producto.id).slice(0, 4);

  const handleAgregar = () => {
    for (let i = 0; i < cantidad; i++) {
      agregar({ id: producto.id, nombre: producto.nombre, precio: producto.precio, categoria: producto.categoria, icono: producto.icono });
    }
    setAgregado(true);
    setTimeout(() => setAgregado(false), 2000);
  };

  return (
    <>
      <div className="prod-detalle-container">

        <div className="prod-detalle-card">

          <div className="prod-detalle-icono-wrap">
            <span className="prod-detalle-icono">{producto.icono}</span>
          </div>

          <div className="prod-detalle-info">
            <span className="prod-detalle-cat">{producto.categoria}</span>
            <h1 className="prod-detalle-nombre">{producto.nombre}</h1>
            <p className="prod-detalle-desc">{producto.descripcion}</p>

            <div className="prod-detalle-meta">
              <div className="prod-detalle-meta-item">
                <span className="meta-label">Disponibilidad</span>
                <span className={`meta-valor ${producto.stock > 0 ? 'stock-ok' : 'stock-no'}`}>
                  {producto.stock > 0 ? `✓ En stock (${producto.stock} uds)` : '✗ Sin stock'}
                </span>
              </div>
            </div>

            <p className="prod-detalle-precio">${producto.precio.toLocaleString()}</p>

            {enCarrito > 0 && (
              <p className="prod-detalle-en-carrito">✓ {enCarrito} en tu carrito</p>
            )}

            {/* Selector de cantidad */}
            <div className="prod-cantidad-wrap">
              <span className="prod-cantidad-label">Cantidad</span>
              <div className="prod-cantidad-control">
                <button
                  className="prod-cantidad-btn"
                  onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                  disabled={cantidad <= 1}
                >−</button>
                <span className="prod-cantidad-num">{cantidad}</span>
                <button
                  className="prod-cantidad-btn"
                  onClick={() => setCantidad((c) => Math.min(producto.stock, c + 1))}
                  disabled={cantidad >= producto.stock}
                >+</button>
              </div>
              <span className="prod-cantidad-subtotal">
                Subtotal: <strong>${(producto.precio * cantidad).toLocaleString()}</strong>
              </span>
            </div>

            <div className="prod-detalle-acciones">
              <button
                className={`prod-detalle-btn-agregar ${agregado ? 'agregado' : ''}`}
                onClick={handleAgregar}
                disabled={producto.stock === 0}
              >
                {agregado ? '✓ Agregado' : '🛒 Agregar al carrito'}
              </button>
              <button className="prod-detalle-btn-carrito" onClick={() => navigate('/carrito')}>
                Ver carrito
              </button>
            </div>
          </div>

        </div>

        {/* Productos relacionados */}
        {relacionados.length > 0 && (
          <div className="prod-relacionados">
            <h2 className="prod-relacionados-titulo">Productos relacionados</h2>
            <div className="prod-relacionados-grid">
              {relacionados.map((p) => (
                <Link key={p.id} to={`/producto/${p.id}`} className="prod-rel-card">
                  <span className="prod-rel-icono">{p.icono}</span>
                  <p className="prod-rel-nombre">{p.nombre}</p>
                  <p className="prod-rel-precio">${p.precio.toLocaleString()}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </>
  );
}