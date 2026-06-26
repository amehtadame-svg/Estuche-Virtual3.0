import { useState, useEffect } from 'react';
import Modal from '../../../components/Modal/Modal';
import './DetallePedidos.css';
import { API } from '../../../api';

const formularioVacio = { id_pedido: '', id_producto: '', cantidad: '', precio_unitario: '' };

interface DetallePedido {
  id_detalle_pedido: number;
  id_pedido: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  productos?: { nombre: string } | null;
}

export default function DetallePedidos() {
  const [detalles, setDetalles] = useState<DetallePedido[]>([]);
  const [formulario, setFormulario] = useState(formularioVacio);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cargando, setCargando] = useState(true);

  // Asume que tienes configurado API.detallePedidos o lo concatenas manualmente
  const endpointBase = API.detalle || `${API.detalle}/pedido`;

  const cargarDetalles = () => {
    fetch(`${endpointBase}`)
      .then(r => r.json())
      .then(data => { 
        setDetalles(data); 
        setCargando(false); 
      })
      .catch(() => { 
        mostrarMensaje('Error al cargar los detalles del pedido.'); 
        setCargando(false); 
      });
  };

  useEffect(() => { 
    cargarDetalles(); 
  }, []);

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
      id_pedido: Number(formulario.id_pedido),
      id_producto: Number(formulario.id_producto),
      cantidad: Number(formulario.cantidad),
      precio_unitario: Number(formulario.precio_unitario),
    };

    try {
      if (editandoId !== null) {
        await fetch(`${endpointBase}/${editandoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        mostrarMensaje('Detalle de pedido actualizado.');
      } else {
        await fetch(`${endpointBase}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        mostrarMensaje('Detalle de pedido agregado.');
      }
      cargarDetalles();
      cerrarModal();
    } catch {
      mostrarMensaje('Error al procesar la operación.');
    }
  };

  const handleEditar = (d: DetallePedido) => {
    setFormulario({
      id_pedido: String(d.id_pedido),
      id_producto: String(d.id_producto),
      cantidad: String(d.cantidad),
      precio_unitario: String(d.precio_unitario),
    });
    setEditandoId(d.id_detalle_pedido);
    setModalAbierto(true);
  };

  const handleEliminar = async (id: number) => {
    try {
      await fetch(`${endpointBase}/${id}`, { method: 'DELETE' });
      setDetalles(detalles.filter(d => d.id_detalle_pedido !== id));
      mostrarMensaje('Detalle de pedido eliminado.');
    } catch {
      mostrarMensaje('Error al eliminar el registro.');
    }
  };

  return (
    <>
      <div className="detalle-pedidos-page">
        <div className="detalle-pedidos-topbar">
          <div>
            <h2 className="titulo-detalle-pedidos">Detalle de Pedidos</h2>
            <p className="subtitulo-usuarios" style={{ margin: 0, color: 'var(--text)' }}>
              Administra los artículos asignados a cada orden de compra
            </p>
          </div>
          <button className="btn-nuevo-detalle-pedido" onClick={abrirModalNuevo}>
            + Nuevo Artículo
          </button>
        </div>

        {mensaje && <div className="mensaje-detalle-pedidos">{mensaje}</div>}

        {cargando ? (
          <p style={{ color: 'var(--text)', padding: '20px 0' }}>Cargando artículos...</p>
        ) : (
          <table className="tabla-detalle-pedidos">
            <thead>
              <tr>
                <th>N° Pedido</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio Unitario</th>
                <th>Subtotal</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {detalles.map((d) => {
                const subtotal = d.cantidad * d.precio_unitario;
                return (
                  <tr key={d.id_detalle_pedido}>
                    <td className="numero-detalle-pedido">PED-{String(d.id_pedido).padStart(3, '0')}</td>
                    <td className="producto-detalle-pedido">{d.productos?.nombre ?? `Producto #${d.id_producto}`}</td>
                    <td>{d.cantidad}</td>
                    <td>${Number(d.precio_unitario).toLocaleString()}</td>
                    <td className="subtotal-detalle-pedido">${subtotal.toLocaleString()}</td>
                    <td>
                      <button className="btn-editar-detalle-pedido" onClick={() => handleEditar(d)}>Editar</button>
                      <button className="btn-eliminar-detalle-pedido" onClick={() => handleEliminar(d.id_detalle_pedido)}>Eliminar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalAbierto && (
        <Modal
          titulo={editandoId !== null ? 'Editar artículo de pedido' : 'Nuevo artículo de pedido'}
          onClose={cerrarModal}
          footer={
            <>
              <button className="btn-cancelar-detalle-pedido" onClick={cerrarModal}>Cancelar</button>
              <button className="btn-guardar-detalle-pedido" onClick={handleGuardar}>
                {editandoId !== null ? 'Guardar cambios' : 'Agregar artículo'}
              </button>
            </>
          }
        >
          <label className="label-detalle-pedido">ID Pedido</label>
          <input className="input-detalle-pedido" name="id_pedido" type="number" value={formulario.id_pedido} onChange={handleCambio} placeholder="ID de la orden general" />

          <label className="label-detalle-pedido">ID Producto</label>
          <input className="input-detalle-pedido" name="id_producto" type="number" value={formulario.id_producto} onChange={handleCambio} placeholder="ID del artículo" />

          <label className="label-detalle-pedido">Cantidad</label>
          <input className="input-detalle-pedido" name="cantidad" type="number" value={formulario.cantidad} onChange={handleCambio} placeholder="Unidades" />

          <label className="label-detalle-pedido">Precio Unitario</label>
          <input className="input-detalle-pedido" name="precio_unitario" type="number" value={formulario.precio_unitario} onChange={handleCambio} placeholder="Valor unitario" />
        </Modal>
      )}
    </>
  );
}