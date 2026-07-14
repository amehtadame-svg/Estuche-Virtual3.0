// Devoluciones.tsx
import { useState, useEffect } from 'react';
import Header from '../../../components/Header/Header';
import { API } from '../../../api';
import './Devoluciones.css';

interface Devolucion {
  id_devolucion:    number;
  id_pedido:        number;
  cantidad:         number;
  motivo:           string;
  estado:           string;
  estado_producto:  string;
  reembolso:        number;
  fecha_solicitud:  string;
  fecha_resolucion: string | null;
  clientes:         { nombre: string; email: string };
  productos:        { nombre: string };
  pedidos:          { id_pedido: number };
}

const estadoColor: Record<string, string> = {
  solicitada:  '#f59e0b',
  aprobada:    '#10b981',
  rechazada:   '#e74c3c',
  reembolsada: '#3b82f6',
};

const formularioVacio = {
  estado:          'aprobada',
  estado_producto: 'bueno',
  reembolso:       '',
};

export default function Devoluciones() {
  const [devoluciones, setDevoluciones] = useState<Devolucion[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [seleccionada, setSeleccionada] = useState<Devolucion | null>(null);
  const [formulario, setFormulario]     = useState(formularioVacio);
  const [mensaje, setMensaje]           = useState('');
  const [filtro, setFiltro]             = useState('todos');
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const mostrarMensaje = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(''), 2500);
  };

  const cargar = async () => {
    const res = await fetch(API.devoluciones, { headers });
    if (res.ok) setDevoluciones(await res.json());
  };

  useEffect(() => { cargar(); }, []);

  const abrirModal = (d: Devolucion) => {
    setSeleccionada(d);
    setFormulario({
      estado:          d.estado === 'solicitada' ? 'aprobada' : d.estado,
      estado_producto: d.estado_producto,
      reembolso:       String(d.reembolso ?? 0),
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setSeleccionada(null);
    setFormulario(formularioVacio);
  };

  const handleCambio = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const handleResolver = async () => {
    if (!seleccionada) return;
    const res = await fetch(`${API.devoluciones}/${seleccionada.id_devolucion}/resolver`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        estado:          formulario.estado,
        estado_producto: formulario.estado_producto,
        reembolso:       Number(formulario.reembolso) || 0,
      }),
    });
    if (res.ok) {
      mostrarMensaje('Devolución resuelta.');
      cerrarModal();
      cargar();
    }
  };

  const devolucionesFiltradas = filtro === 'todos'
    ? devoluciones
    : devoluciones.filter((d) => d.estado === filtro);

  return (
    <>
      <Header />
      <div className="devoluciones-page">

        <div className="devoluciones-topbar">
          <h2 className="titulo-devoluciones">Gestión de Devoluciones</h2>
          <div className="devoluciones-filtros">
            {['todos', 'solicitada', 'aprobada', 'rechazada', 'reembolsada'].map((f) => (
              <button
                key={f}
                className={`btn-filtro-dev ${filtro === f ? 'btn-filtro-dev-activo' : ''}`}
                onClick={() => setFiltro(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {mensaje && <div className="mensaje-devoluciones">{mensaje}</div>}

        <div className="table-wrapper">
          <table className="tabla-devoluciones">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Motivo</th>
                <th>Estado producto</th>
                <th>Reembolso</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {devolucionesFiltradas.map((d) => (
                <tr key={d.id_devolucion}>
                  <td className="id-devolucion">#{d.id_devolucion}</td>
                  <td>
                    <p className="cliente-dev-nombre">{d.clientes.nombre}</p>
                    <p className="cliente-dev-email">{d.clientes.email}</p>
                  </td>
                  <td className="producto-dev">{d.productos.nombre}</td>
                  <td>{d.cantidad}</td>
                  <td className="motivo-dev">{d.motivo}</td>
                  <td>
                    <span className={`badge-producto-dev badge-producto-${d.estado_producto}`}>
                      {d.estado_producto}
                    </span>
                  </td>
                  <td className="reembolso-dev">
                    {Number(d.reembolso) > 0 ? `$${Number(d.reembolso).toLocaleString()}` : '—'}
                  </td>
                  <td>{d.fecha_solicitud.slice(0, 10)}</td>
                  <td>
                    <span
                      className="badge-estado-dev"
                      style={{ backgroundColor: estadoColor[d.estado] ?? '#999' }}
                    >
                      {d.estado}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-resolver-dev"
                      onClick={() => abrirModal(d)}
                      disabled={d.estado === 'reembolsada'}
                    >
                      {d.estado === 'solicitada' ? 'Resolver' : 'Editar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {modalAbierto && seleccionada && (
          <div className="modal-overlay-dev" onClick={cerrarModal}>
            <div className="modal-devoluciones" onClick={(e) => e.stopPropagation()}>

              <div className="modal-header-dev">
                <h3 className="modal-titulo-dev">Resolver devolución #{seleccionada.id_devolucion}</h3>
                <button className="modal-cerrar-dev" onClick={cerrarModal}>✕</button>
              </div>

              <div className="modal-body-dev">

                <div className="dev-info-card">
                  <p><strong>Cliente:</strong> {seleccionada.clientes.nombre}</p>
                  <p><strong>Producto:</strong> {seleccionada.productos.nombre}</p>
                  <p><strong>Cantidad:</strong> {seleccionada.cantidad}</p>
                  <p><strong>Motivo:</strong> {seleccionada.motivo}</p>
                </div>

                <p className="label-dev">Resolución</p>
                <select className="input-dev" name="estado" value={formulario.estado} onChange={handleCambio}>
                  <option value="aprobada">Aprobar</option>
                  <option value="rechazada">Rechazar</option>
                  <option value="reembolsada">Reembolsada</option>
                </select>

                <p className="label-dev">Estado del producto</p>
                <select className="input-dev" name="estado_producto" value={formulario.estado_producto} onChange={handleCambio}>
                  <option value="bueno">Bueno</option>
                  <option value="dañado">Dañado</option>
                  <option value="modificado">Modificado</option>
                  <option value="incompleto">Incompleto</option>
                </select>

                <p className="label-dev">Monto de reembolso</p>
                <input
                  className="input-dev"
                  name="reembolso"
                  type="number"
                  value={formulario.reembolso}
                  onChange={handleCambio}
                  placeholder="0"
                />
              </div>

              <div className="modal-footer-dev">
                <button className="btn-cancelar-dev" onClick={cerrarModal}>Cancelar</button>
                <button className="btn-guardar-dev" onClick={handleResolver}>Confirmar resolución</button>
              </div>

            </div>
          </div>
        )}

      </div>
    </>
  );
}