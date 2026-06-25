import { useState, useEffect } from 'react';
import Modal from '../../../components/Modal/Modal';
import { API } from '../../../api';
import './Facturas.css';

const estadoColor: Record<string, string> = {
  Pagada: '#27ae60',
  Pendiente: '#f39c12',
  Anulada: '#e74c3c',
};

const formularioVacio = { id_cliente: '', fecha: '', total: '', estado: 'Pendiente' };

interface Factura {
  id_factura: number;
  id_cliente: number | null;
  fecha: string | null;
  total: number | null;
  estado: string | null;
  clientes: { nombre: string } | null;
}

export default function Facturas() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [formulario, setFormulario] = useState(formularioVacio);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cargando, setCargando] = useState(true);

  const cargarFacturas = () => {
    fetch(API.facturas)
      .then(r => r.json())
      .then(data => { setFacturas(data); setCargando(false); })
      .catch(() => { mostrarMensaje('Error al cargar facturas.'); setCargando(false); });
  };

  useEffect(() => { cargarFacturas(); }, []);

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

  const handleGuardar = async () => {
    if (!formulario.id_cliente || !formulario.fecha || !formulario.total) {
      mostrarMensaje('Por favor completa todos los campos.');
      return;
    }

    const body = {
      id_cliente: Number(formulario.id_cliente),
      fecha: formulario.fecha,
      total: Number(formulario.total),
      estado: formulario.estado,
    };

    if (editandoId !== null) {
      await fetch(`${API.facturas}/${editandoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      mostrarMensaje('Factura actualizada.');
    } else {
      await fetch(API.facturas, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      mostrarMensaje('Factura agregada.');
    }

    cargarFacturas();
    cerrarModal();
  };

  const handleEditar = (f: Factura) => {
    setFormulario({
      id_cliente: String(f.id_cliente ?? ''),
      fecha: f.fecha ? f.fecha.split('T')[0] : '',
      total: String(f.total ?? ''),
      estado: f.estado ?? 'Pendiente',
    });
    setEditandoId(f.id_factura);
    setModalAbierto(true);
  };

  const handleEliminar = async (id: number) => {
    await fetch(`${API.facturas}/${id}`, { method: 'DELETE' });
    setFacturas(facturas.filter(f => f.id_factura !== id));
    mostrarMensaje('Factura eliminada.');
  };

  const cambiarEstado = async (id: number, nuevoEstado: string) => {
    await fetch(`${API.facturas}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado }),
    });
    setFacturas(facturas.map(f => f.id_factura === id ? { ...f, estado: nuevoEstado } : f));
    mostrarMensaje('Estado actualizado.');
  };

  return (
    <>
      <div className="facturas-page">

        <div className="facturas-topbar">
          <h2 className="titulo-facturas">Gestion de Facturas</h2>
          <p className="subtitulo-usuarios">Administra las Facturas registradas</p>
          <button className="btn-nuevo-factura" onClick={abrirModalNuevo}>
            + Nueva factura
          </button>
        </div>

        {mensaje && <div className="mensaje-facturas">{mensaje}</div>}

        {cargando ? (
          <p style={{ color: 'var(--text)', padding: '20px 0' }}>Cargando facturas...</p>
        ) : (
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
                <tr key={fac.id_factura}>
                  <td className="numero-factura">FAC-{String(fac.id_factura).padStart(3, '0')}</td>
                  <td className="cliente-factura">{fac.clientes?.nombre ?? `Cliente #${fac.id_cliente}`}</td>
                  <td>{fac.fecha ? fac.fecha.split('T')[0] : '—'}</td>
                  <td className="total-factura">${Number(fac.total).toLocaleString()}</td>
                  <td>
                    <select
                      value={fac.estado ?? 'Pendiente'}
                      onChange={(e) => cambiarEstado(fac.id_factura, e.target.value)}
                      className="estado-select-factura"
                      style={{ backgroundColor: estadoColor[fac.estado ?? ''] || '#999' }}
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="Pagada">Pagada</option>
                      <option value="Anulada">Anulada</option>
                    </select>
                  </td>
                  <td>
                    <button className="btn-editar-factura" onClick={() => handleEditar(fac)}>Editar</button>
                    <button className="btn-eliminar-factura" onClick={() => handleEliminar(fac.id_factura)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalAbierto && (
        <Modal
          titulo={editandoId !== null ? 'Editar factura' : 'Nueva factura'}
          onClose={cerrarModal}
          footer={
            <>
              <button className="btn-cancelar-factura" onClick={cerrarModal}>Cancelar</button>
              <button className="btn-guardar-factura" onClick={handleGuardar}>
                {editandoId !== null ? 'Guardar cambios' : 'Agregar factura'}
              </button>
            </>
          }
        >
          <label className="label-factura">ID Cliente</label>
          <input className="input-factura" type="number" name="id_cliente" value={formulario.id_cliente} onChange={handleCambio} placeholder="ID del cliente" />

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
        </Modal>
      )}
    </>
  );
}