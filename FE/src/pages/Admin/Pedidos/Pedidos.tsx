import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import { API } from '../../../api/api';
import './Pedidos.css';

const estadoColor: Record<string, string> = {
  pendiente: '#3498db',
  'en camino': '#f39c12',
  entregado: '#27ae60',
  cancelado: '#e74c3c',
};

const formularioVacio = {
  id_cliente: '',
  total: '',
  estado: 'pendiente',
  id_descuento: '',
};

interface Pedido {
  id_pedido: number;
  id_cliente: number | null;
  total: number | null;
  estado: string | null;
  fecha_pedido: string | null;
  clientes: { nombre: string } | null;
  descuentos: { codigo: string; valor: number } | null;
  usuarios_pedidos_id_repartidorTousuarios: { nombre: string } | null;
}

export default function Pedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [formulario, setFormulario] = useState(formularioVacio);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [codigoDescuento, setCodigoDescuento] = useState('');
  const [descuentoAplicado, setDescuentoAplicado] = useState<string | null>(null);

  const cargarPedidos = () => {
    fetch(API.pedidos)
      .then(r => r.json())
      .then(data => { setPedidos(data); setCargando(false); })
      .catch(() => { mostrarMensaje('Error al cargar pedidos.'); setCargando(false); });
  };

  useEffect(() => { cargarPedidos(); }, []);

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
    setCodigoDescuento('');
    setDescuentoAplicado(null);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEditandoId(null);
    setFormulario(formularioVacio);
    setCodigoDescuento('');
    setDescuentoAplicado(null);
  };

  const handleGuardar = async () => {
    if (!formulario.id_cliente || !formulario.total) {
      mostrarMensaje('Por favor completa todos los campos.');
      return;
    }

    const body = {
      id_cliente: Number(formulario.id_cliente),
      total: Number(formulario.total),
      estado: formulario.estado,
      id_descuento: formulario.id_descuento ? Number(formulario.id_descuento) : null,
    };

    if (editandoId !== null) {
      await fetch(`${API.pedidos}/${editandoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      mostrarMensaje('Pedido actualizado.');
    } else {
      await fetch(API.pedidos, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      mostrarMensaje('Pedido agregado.');
    }

    cargarPedidos();
    cerrarModal();
  };

  const handleEditar = (p: Pedido) => {
    setFormulario({
      id_cliente: String(p.id_cliente ?? ''),
      total: String(p.total ?? ''),
      estado: p.estado ?? 'pendiente',
      id_descuento: '',
    });
    setEditandoId(p.id_pedido);
    setCodigoDescuento('');
    setDescuentoAplicado(null);
    setModalAbierto(true);
  };

  const handleEliminar = async (id: number) => {
    await fetch(`${API.pedidos}/${id}`, { method: 'DELETE' });
    setPedidos(pedidos.filter(p => p.id_pedido !== id));
    mostrarMensaje('Pedido eliminado.');
  };

  const cambiarEstado = async (id: number, nuevoEstado: string) => {
    const res = await fetch(`${API.pedidos}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado }),
    });
    if (res.ok) {
      setPedidos(pedidos.map(p => p.id_pedido === id ? { ...p, estado: nuevoEstado } : p));
      mostrarMensaje('Estado actualizado.');
    } else {
      mostrarMensaje('Error al actualizar el estado.');
    }
  };

const handleAplicarDescuento = async (id: number) => {
  if (!codigoDescuento) {
    mostrarMensaje('Ingresa un código de descuento.');
    return;
  }
  console.log('Aplicando descuento:', id, codigoDescuento);

   const token = localStorage.getItem('token');
  const res = await fetch(`${API.pedidos}/${id}/descuento`, {
    method: 'POST',
        headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ codigo: codigoDescuento }),
  });
  console.log('Status respuesta:', res.status);
  const data = await res.json();
console.log('Total recibido del backend:', data.total);
  if (res.ok) {
    setFormulario(prev => ({ ...prev, total: String(data.total) }));
    setDescuentoAplicado(`Descuento aplicado. Nuevo total: $${Number(data.total).toLocaleString()}`);
    setCodigoDescuento('');
    cargarPedidos();
  } else {
    mostrarMensaje(data.message ?? 'Error al aplicar el descuento.');
  }
};

  return (
    <>
      <div className="pedidos-page">

        <div className="pedidos-topbar">
          <h2 className="titulo-pedidos">Gestion de Pedidos</h2>
          <p className="subtitulo-usuarios">Administra los Pedidos registrados</p>
          <button className="btn-nuevo-pedido" onClick={abrirModalNuevo}>
            + Nuevo pedido
          </button>
        </div>

        {mensaje && <div className="mensaje-pedidos">{mensaje}</div>}

        {cargando ? (
          <p style={{ color: 'var(--text)', padding: '20px 0' }}>Cargando pedidos...</p>
        ) : (
          <table className="tabla-pedidos">
            <thead>
              <tr>
                <th>N° Pedido</th>
                <th>Cliente</th>
                <th>Descuento</th>
                <th>Total pedido</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((ped) => (
                <tr key={ped.id_pedido}>
                  <td className="numero-pedido">PED-{String(ped.id_pedido).padStart(3, '0')}</td>
                  <td className="cliente-pedido">{ped.clientes?.nombre ?? `Cliente #${ped.id_cliente}`}</td>
                  <td>{ped.descuentos ? `${ped.descuentos.codigo} (${ped.descuentos.valor}%)` : '—'}</td>
                  <td className="total-pedido">${Number(ped.total).toLocaleString()}</td>
                  <td>{ped.fecha_pedido ? ped.fecha_pedido.split('T')[0] : '—'}</td>
                  <td>
                    <select
                      value={ped.estado ?? 'pendiente'}
                      onChange={(e) => cambiarEstado(ped.id_pedido, e.target.value)}
                      className="estado-select-pedido"
                      style={{ backgroundColor: estadoColor[ped.estado ?? ''] || '#999', color: '#fff' }}
                    >
                      <option value="pendiente" style={{ backgroundColor: '#fff', color: '#1E2761' }}>Pendiente</option>
                      <option value="en camino" style={{ backgroundColor: '#fff', color: '#1E2761' }}>En camino</option>
                      <option value="entregado" style={{ backgroundColor: '#fff', color: '#1E2761' }}>Entregado</option>
                      <option value="cancelado" style={{ backgroundColor: '#fff', color: '#1E2761' }}>Cancelado</option>
                    </select>
                  </td>
                  <td>
                    <button className="btn-editar-pedido" onClick={() => handleEditar(ped)}>Editar</button>
                    <button className="btn-eliminar-pedido" onClick={() => handleEliminar(ped.id_pedido)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalAbierto && (
        <Modal
          titulo={editandoId !== null ? 'Editar pedido' : 'Nuevo pedido'}
          onClose={cerrarModal}
          footer={
            <>
              <button className="btn-cancelar-pedido" onClick={cerrarModal}>Cancelar</button>
              <button className="btn-guardar-pedido" onClick={handleGuardar}>
                {editandoId !== null ? 'Guardar cambios' : 'Agregar pedido'}
              </button>
            </>
          }
        >
          <label className="label-pedido">ID Cliente</label>
          <input
            className="input-pedido"
            name="id_cliente"
            type="number"
            value={formulario.id_cliente}
            onChange={handleCambio}
            placeholder="ID del cliente"
          />

          <label className="label-pedido">Total</label>
          <input
            className="input-pedido"
            type="number"
            name="total"
            value={formulario.total}
            onChange={handleCambio}
            placeholder="85000"
          />

          <label className="label-pedido">Estado</label>
          <select className="input-pedido" name="estado" value={formulario.estado} onChange={handleCambio}>
            <option value="pendiente">Pendiente</option>
            <option value="en camino">En camino</option>
            <option value="entregado">Entregado</option>
            <option value="cancelado">Cancelado</option>
          </select>

          {editandoId !== null && (
            <div style={{ marginTop: 16 }}>
              <label className="label-pedido">Código de descuento</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="input-pedido"
                  placeholder="Ej: REGRESO10"
                  value={codigoDescuento}
                  onChange={(e) => setCodigoDescuento(e.target.value)}
                  style={{ marginBottom: 0 }}
                />
                <button
                  className="btn-guardar-pedido"
                  onClick={() => handleAplicarDescuento(editandoId)}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Aplicar
                </button>
              </div>
              {descuentoAplicado && (
                <p style={{ color: '#27ae60', fontWeight: 600, fontSize: 13, marginTop: 8 }}>
                  {descuentoAplicado}
                </p>
              )}
            </div>
          )}
        </Modal>
      )}
    </>
  );
}