import { useState, useEffect } from 'react';
import Modal from '../../../components/Modal/Modal';
import './DetallePedidos.css';
import { API } from '../../../api';

const formularioVacio = { id_pedido: '', id_producto: '', cantidad: '', precio_unitario: '' };

interface DetallePedido {
  id_detalle:   number;
  id_pedido:    number;
  id_producto:  number;
  cantidad:     number;
  precio:       number;
  subtotal:     number;
  productos?:   { nombre: string } | null;
}

export default function DetallePedidos() {
  const [detalles, setDetalles]         = useState<DetallePedido[]>([]);
  const [filtrados, setFiltrados]       = useState<DetallePedido[]>([]);
  const [formulario, setFormulario]     = useState(formularioVacio);
  const [editandoId, setEditandoId]     = useState<number | null>(null);
  const [mensaje, setMensaje]           = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cargando, setCargando]         = useState(true);
  const [busqueda, setBusqueda]         = useState('');

  const cargarDetalles = () => {
    fetch(API.detallePedidos)
      .then(r => r.json())
      .then(data => {
        setDetalles(data);
        setFiltrados(data);
        setCargando(false);
      })
      .catch(() => {
        mostrarMensaje('Error al cargar los detalles del pedido.');
        setCargando(false);
      });
  };

  useEffect(() => { cargarDetalles(); }, []);

  useEffect(() => {
    if (!busqueda) {
      setFiltrados(detalles);
      return;
    }
    setFiltrados(detalles.filter(d =>
      String(d.id_pedido).includes(busqueda) ||
      d.productos?.nombre.toLowerCase().includes(busqueda.toLowerCase())
    ));
  }, [busqueda, detalles]);

  const mostrarMensaje = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(''), 2500);
  };

  const handleCambio = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const abrirModalNuevo = () => {
    setFormulario(formularioVacio);
    setEditandoId(null);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEditandoId(null);
    setFormulario(formularioVacio);
  };

  const handleGuardar = async () => {
    if (!formulario.id_pedido || !formulario.id_producto || !formulario.cantidad || !formulario.precio_unitario) {
      mostrarMensaje('Por favor completa todos los campos.');
      return;
    }

    const body = {
      id_pedido:   Number(formulario.id_pedido),
      id_producto: Number(formulario.id_producto),
      cantidad:    Number(formulario.cantidad),
      precio:      Number(formulario.precio_unitario),
    };

    try {
      if (editandoId !== null) {
        await fetch(`${API.detallePedidos}/${editandoId}`, {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(body),
        });
        mostrarMensaje('Detalle actualizado.');
      } else {
        await fetch(API.detallePedidos, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(body),
        });
        mostrarMensaje('Artículo agregado.');
      }
      cargarDetalles();
      cerrarModal();
    } catch {
      mostrarMensaje('Error al procesar la operación.');
    }
  };

  const handleEditar = (d: DetallePedido) => {
    setFormulario({
      id_pedido:       String(d.id_pedido),
      id_producto:     String(d.id_producto),
      cantidad:        String(d.cantidad),
      precio_unitario: String(d.precio),
    });
    setEditandoId(d.id_detalle);
    setModalAbierto(true);
  };

  const handleEliminar = async (id: number) => {
    try {
      await fetch(`${API.detallePedidos}/${id}`, { method: 'DELETE' });
      setDetalles(detalles.filter(d => d.id_detalle !== id));
      mostrarMensaje('Artículo eliminado.');
    } catch {
      mostrarMensaje('Error al eliminar el registro.');
    }
  };

  const totalGeneral = filtrados.reduce((acc, d) => acc + Number(d.subtotal ?? d.cantidad * d.precio), 0);

  return (
    <>
      <div className="detalle-pedidos-page">

        <div className="detalle-pedidos-topbar">
          <div>
            <h2 className="titulo-detalle-pedidos">Detalle de Pedidos</h2>
            <p className="subtitulo-detalle-pedidos">
              Administra los artículos asignados a cada orden de compra
            </p>
          </div>
          <button className="btn-nuevo-detalle-pedido" onClick={abrirModalNuevo}>
            + Nuevo artículo
          </button>
        </div>

        <div className="detalle-pedidos-filtros">
          <input
            className="detalle-pedidos-busqueda"
            placeholder="🔍 Buscar por N° pedido o producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {mensaje && <div className="mensaje-detalle-pedidos">{mensaje}</div>}

        {cargando ? (
          <p className="detalle-pedidos-cargando">Cargando artículos...</p>
        ) : (
          <>
            <table className="tabla-detalle-pedidos">
              <thead>
                <tr>
                  <th>N° Pedido</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio unitario</th>
                  <th>Subtotal</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((d) => {
                  const subtotal = d.subtotal ?? d.cantidad * d.precio;
                  return (
                    <tr key={d.id_detalle}>
                      <td className="numero-detalle-pedido">
                        PED-{String(d.id_pedido).padStart(3, '0')}
                      </td>
                      <td className="producto-detalle-pedido">
                        {d.productos?.nombre ?? `Producto #${d.id_producto}`}
                      </td>
                      <td>{d.cantidad}</td>
                      <td>${Number(d.precio).toLocaleString()}</td>
                      <td className="subtotal-detalle-pedido">
                        ${Number(subtotal).toLocaleString()}
                      </td>
                      <td>
                        <button className="btn-editar-detalle-pedido"   onClick={() => handleEditar(d)}>Editar</button>
                        <button className="btn-eliminar-detalle-pedido" onClick={() => handleEliminar(d.id_detalle)}>Eliminar</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtrados.length === 0 && (
              <p className="detalle-pedidos-vacio">No se encontraron artículos.</p>
            )}

            {filtrados.length > 0 && (
              <div className="detalle-pedidos-total">
                <span>Total general</span>
                <span>${totalGeneral.toLocaleString()}</span>
              </div>
            )}
          </>
        )}
      </div>

      {modalAbierto && (
        <Modal
          titulo={editandoId !== null ? 'Editar artículo' : 'Nuevo artículo'}
          onClose={cerrarModal}
          footer={
            <>
              <button className="btn-cancelar-detalle-pedido" onClick={cerrarModal}>Cancelar</button>
              <button className="btn-guardar-detalle-pedido"  onClick={handleGuardar}>
                {editandoId !== null ? 'Guardar cambios' : 'Agregar artículo'}
              </button>
            </>
          }
        >
          <label className="label-detalle-pedido">ID Pedido</label>
          <input
            className="input-detalle-pedido"
            name="id_pedido"
            type="number"
            value={formulario.id_pedido}
            onChange={handleCambio}
            placeholder="ID de la orden"
          />

          <label className="label-detalle-pedido">ID Producto</label>
          <input
            className="input-detalle-pedido"
            name="id_producto"
            type="number"
            value={formulario.id_producto}
            onChange={handleCambio}
            placeholder="ID del producto"
          />

          <label className="label-detalle-pedido">Cantidad</label>
          <input
            className="input-detalle-pedido"
            name="cantidad"
            type="number"
            value={formulario.cantidad}
            onChange={handleCambio}
            placeholder="Unidades"
          />

          <label className="label-detalle-pedido">Precio unitario</label>
          <input
            className="input-detalle-pedido"
            name="precio_unitario"
            type="number"
            value={formulario.precio_unitario}
            onChange={handleCambio}
            placeholder="Valor unitario"
          />
        </Modal>
      )}
    </>
  );
}