import { useState } from 'react';
import Modal from '../../../components/Modal/Modal';
import './DetalleFacturas.css';

const detallesIniciales = [
  { id: 1, factura: 'FAC-001', producto: 'Cuaderno universitario', cantidad: 2, precioUnitario: 8500 },
  { id: 2, factura: 'FAC-001', producto: 'Lapicero azul x10', cantidad: 1, precioUnitario: 5000 },
  { id: 3, factura: 'FAC-002', producto: 'Set de colores x12', cantidad: 1, precioUnitario: 12000 },
  { id: 4, factura: 'FAC-003', producto: 'Mochila escolar', cantidad: 1, precioUnitario: 45000 },
  { id: 5, factura: 'FAC-003', producto: 'Tijeras punta redonda', cantidad: 2, precioUnitario: 6500 },
  { id: 6, factura: 'FAC-004', producto: 'Carpeta argollada', cantidad: 3, precioUnitario: 9500 },
];

const formularioVacio = { factura: '', producto: '', cantidad: '', precioUnitario: '' };

export default function DetalleFacturas() {
  const [detalles, setDetalles] = useState(detallesIniciales);
  const [formulario, setFormulario] = useState(formularioVacio);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);

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

  const handleGuardar = () => {
    if (!formulario.factura || !formulario.producto || !formulario.cantidad || !formulario.precioUnitario) {
      mostrarMensaje('Por favor completa todos los campos.');
      return;
    }
    if (editandoId !== null) {
      setDetalles(detalles.map((d) =>
        d.id === editandoId
          ? { ...d, factura: formulario.factura, producto: formulario.producto, cantidad: Number(formulario.cantidad), precioUnitario: Number(formulario.precioUnitario) }
          : d
      ));
      mostrarMensaje('Detalle actualizado.');
    } else {
      setDetalles([...detalles, { id: Date.now(), factura: formulario.factura, producto: formulario.producto, cantidad: Number(formulario.cantidad), precioUnitario: Number(formulario.precioUnitario) }]);
      mostrarMensaje('Detalle agregado.');
    }
    cerrarModal();
  };

  const handleEditar = (d: typeof detallesIniciales[0]) => {
    setFormulario({ factura: d.factura, producto: d.producto, cantidad: String(d.cantidad), precioUnitario: String(d.precioUnitario) });
    setEditandoId(d.id);
    setModalAbierto(true);
  };

  const handleEliminar = (id: number) => {
    setDetalles(detalles.filter((d) => d.id !== id));
    mostrarMensaje('Detalle eliminado.');
  };

  return (
    <>
      <div className="detalle-page">

        <div className="detalle-topbar">
          <h2 className="titulo-detalle">Detalle de Facturas</h2>
          <p className="subtitulo-usuarios">Administra los Detalles de las Facturas registradas</p>
          <button className="btn-nuevo-detalle" onClick={abrirModalNuevo}>
            + Nuevo detalle
          </button>
        </div>

        {mensaje && <div className="mensaje-detalle">{mensaje}</div>}

        <table className="tabla-detalle">
          <thead>
            <tr>
              <th>N° Factura</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio unitario</th>
              <th>Subtotal</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {detalles.map((d) => (
              <tr key={d.id}>
                <td className="factura-detalle">{d.factura}</td>
                <td className="producto-detalle">{d.producto}</td>
                <td>{d.cantidad}</td>
                <td>${d.precioUnitario.toLocaleString()}</td>
                <td className="subtotal-detalle">${(d.cantidad * d.precioUnitario).toLocaleString()}</td>
                <td>
                  <button className="btn-editar-detalle" onClick={() => handleEditar(d)}>Editar</button>
                  <button className="btn-eliminar-detalle" onClick={() => handleEliminar(d.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <Modal
          titulo={editandoId !== null ? 'Editar detalle' : 'Nuevo detalle'}
          onClose={cerrarModal}
          footer={
            <>
              <button className="btn-cancelar-detalle" onClick={cerrarModal}>Cancelar</button>
              <button className="btn-guardar-detalle" onClick={handleGuardar}>
                {editandoId !== null ? 'Guardar cambios' : 'Agregar detalle'}
              </button>
            </>
          }
        >
          <label className="label-detalle">N° Factura</label>
          <input className="input-detalle" name="factura" value={formulario.factura} onChange={handleCambio} placeholder="Ej: FAC-001" />

          <label className="label-detalle">Producto</label>
          <input className="input-detalle" name="producto" value={formulario.producto} onChange={handleCambio} placeholder="Nombre del producto" />

          <label className="label-detalle">Cantidad</label>
          <input className="input-detalle" type="number" name="cantidad" value={formulario.cantidad} onChange={handleCambio} placeholder="Cantidad" />

          <label className="label-detalle">Precio unitario</label>
          <input className="input-detalle" type="number" name="precioUnitario" value={formulario.precioUnitario} onChange={handleCambio} placeholder="Precio en pesos" />
        </Modal>
      )}
    </>
  );
}