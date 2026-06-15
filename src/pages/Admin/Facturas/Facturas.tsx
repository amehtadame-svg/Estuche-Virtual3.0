import { useState } from 'react';
import Header from '../../../components/Header/Header';
import './Facturas.css';

const facturasIniciales = [
  { id: 1, numero: 'FAC-001', cliente: 'Valentina Lopez', fecha: '2025-01-10', total: 85000, estado: 'Pagada' },
  { id: 2, numero: 'FAC-002', cliente: 'Isabella Garcia', fecha: '2025-01-12', total: 47000, estado: 'Pendiente' },
  { id: 3, numero: 'FAC-003', cliente: 'Camila Rodriguez', fecha: '2025-01-14', total: 120000, estado: 'Pagada' },
  { id: 4, numero: 'FAC-004', cliente: 'Lucia Torres', fecha: '2025-01-16', total: 35000, estado: 'Pendiente' },
  { id: 5, numero: 'FAC-005', cliente: 'Antonella Ramirez', fecha: '2025-01-18', total: 53000, estado: 'Anulada' },
];

const estadoColor: Record<string, string> = {
  Pagada: '#27ae60',
  Pendiente: '#f39c12',
  Anulada: '#e74c3c',
};

const formularioVacio = { numero: '', cliente: '', fecha: '', total: '', estado: 'Pendiente' };

export default function Facturas() {
  const [facturas, setFacturas] = useState(facturasIniciales);
  const [formulario, setFormulario] = useState(formularioVacio);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);

  const mostrarMensaje = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(''), 2500);
  };

  const handleCambio = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    if (!formulario.numero || !formulario.cliente || !formulario.fecha || !formulario.total) {
      mostrarMensaje('Por favor completa todos los campos.');
      return;
    }
    if (editandoId !== null) {
      setFacturas(facturas.map((f) =>
        f.id === editandoId ? { ...f, ...formulario, total: Number(formulario.total) } : f
      ));
      mostrarMensaje('Factura actualizada.');
    } else {
      setFacturas([...facturas, { id: Date.now(), ...formulario, total: Number(formulario.total) }]);
      mostrarMensaje('Factura agregada.');
    }
    cerrarModal();
  };

  const handleEditar = (f: typeof facturasIniciales[0]) => {
    setFormulario({ numero: f.numero, cliente: f.cliente, fecha: f.fecha, total: String(f.total), estado: f.estado });
    setEditandoId(f.id);
    setModalAbierto(true);
  };

  const handleEliminar = (id: number) => {
    setFacturas(facturas.filter((f) => f.id !== id));
    mostrarMensaje('Factura eliminada.');
  };

  const cambiarEstado = (id: number, nuevoEstado: string) => {
    setFacturas(facturas.map((f) => f.id === id ? { ...f, estado: nuevoEstado } : f));
    mostrarMensaje('Estado actualizado.');
  };

  return (
    <>
      <Header />
      <div className="facturas-page">

        <div className="facturas-topbar">
          <h2 className="titulo-facturas">Gestion de Facturas</h2>
          <button className="btn-nuevo-factura" onClick={abrirModalNuevo}>
            + Nueva factura
          </button>
        </div>

        {mensaje && <div className="mensaje-facturas">{mensaje}</div>}

        <table className="tabla-facturas">
          <thead>
            <tr>
              <th>N° Factura</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {facturas.map((fac) => (
              <tr key={fac.id}>
                <td className="numero-factura">{fac.numero}</td>
                <td className="cliente-factura">{fac.cliente}</td>
                <td>{fac.fecha}</td>
                <td className="total-factura">${fac.total.toLocaleString()}</td>
                <td>
                  <select
                    value={fac.estado}
                    onChange={(e) => cambiarEstado(fac.id, e.target.value)}
                    className="estado-select-factura"
                    style={{ backgroundColor: estadoColor[fac.estado] || '#999' }}
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Pagada">Pagada</option>
                    <option value="Anulada">Anulada</option>
                  </select>
                </td>
                <td>
                  <button className="btn-editar-factura" onClick={() => handleEditar(fac)}>Editar</button>
                  <button className="btn-eliminar-factura" onClick={() => handleEliminar(fac.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <div
          className="modal-overlay-factura"
          onClick={(e) => { if (e.target === e.currentTarget) cerrarModal(); }}
        >
          <div className="modal-facturas">

            <div className="modal-header-factura">
              <h2 className="modal-titulo-factura">
                {editandoId !== null ? 'Editar factura' : 'Nueva factura'}
              </h2>
              <button className="modal-cerrar-factura" onClick={cerrarModal}>✕</button>
            </div>

            <div className="modal-body-factura">
              <label className="label-factura">N° Factura</label>
              <input className="input-factura" name="numero" value={formulario.numero} onChange={handleCambio} placeholder="FAC-006" />

              <label className="label-factura">Cliente</label>
              <input className="input-factura" name="cliente" value={formulario.cliente} onChange={handleCambio} placeholder="Nombre del cliente" />

              <label className="label-factura">Fecha</label>
              <input className="input-factura" type="date" name="fecha" value={formulario.fecha} onChange={handleCambio} />

              <label className="label-factura">Total</label>
              <input className="input-factura" type="number" name="total" value={formulario.total} onChange={handleCambio} placeholder="85000" />

              <label className="label-factura">Estado</label>
              <select className="input-factura" name="estado" value={formulario.estado} onChange={handleCambio}>
                <option value="Pendiente">Pendiente</option>
                <option value="Pagada">Pagada</option>
                <option value="Anulada">Anulada</option>
              </select>
            </div>

            <div className="modal-footer-factura">
              <button className="btn-guardar-factura" onClick={handleGuardar}>
                {editandoId !== null ? 'Guardar cambios' : 'Agregar factura'}
              </button>
              <button className="btn-cancelar-factura" onClick={cerrarModal}>
                Cancelar
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}