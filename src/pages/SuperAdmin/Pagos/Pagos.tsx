import { useState, useEffect } from 'react';
import Header from '../../../components/Header/Header';
import { API } from '../../../api';
import './Pagos.css';

interface Pago {
  id_pago:            number;
  id_factura:         number;
  pasarela:           string;
  id_transaccion:     string;
  estado:             string;
  metodo_pago:        string | null;
  monto:              number;
  moneda:             string;
  fecha_pago:         string;
  fecha_confirmacion: string | null;
  usuarios:           { nombre: string; email: string };
  facturas:           { id_factura: number; total: number };
}

const estadoColor: Record<string, string> = {
  pendiente:    '#f59e0b',
  aprobado:     '#10b981',
  rechazado:    '#e74c3c',
  reembolsado:  '#3b82f6',
};

export default function Pagos() {
  const [pagos, setPagos]         = useState<Pago[]>([]);
  const [mensaje, setMensaje]     = useState('');
  const [filtro, setFiltro]       = useState('todos');
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const mostrarMensaje = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(''), 2500);
  };

  const cargar = async () => {
    const res = await fetch(API.pagos, { headers });
    if (res.ok) setPagos(await res.json());
  };

  useEffect(() => { cargar(); }, []);

  const handleEstado = async (id: number, estado: string) => {
    const res = await fetch(`${API.pagos}/${id}/estado`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ estado }),
    });
    if (res.ok) { mostrarMensaje('Estado actualizado.'); cargar(); }
  };

  const pagosFiltrados = filtro === 'todos'
    ? pagos
    : pagos.filter((p) => p.estado === filtro);

  const totalFiltrado = pagosFiltrados.reduce((acc, p) => acc + Number(p.monto), 0);

  return (
    <>
      <Header />
      <div className="pagos-page">

        <div className="pagos-topbar">
          <h2 className="titulo-pagos">Gestión de Pagos</h2>
          <div className="pagos-filtros">
            {['todos', 'pendiente', 'aprobado', 'rechazado', 'reembolsado'].map((f) => (
              <button
                key={f}
                className={`btn-filtro-pago ${filtro === f ? 'btn-filtro-activo' : ''}`}
                onClick={() => setFiltro(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {mensaje && <div className="mensaje-pagos">{mensaje}</div>}

        <div className="pagos-resumen">
          <span className="pagos-resumen-texto">
            {pagosFiltrados.length} pago{pagosFiltrados.length !== 1 ? 's' : ''} —
            Total: <strong>${totalFiltrado.toLocaleString()}</strong>
          </span>
        </div>

        <div className="table-wrapper">
          <table className="tabla-pagos">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Transacción</th>
                <th>Pasarela</th>
                <th>Método</th>
                <th>Monto</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pagosFiltrados.map((p) => (
                <tr key={p.id_pago}>
                  <td className="id-pago">#{p.id_pago}</td>
                  <td>
                    <p className="cliente-pago-nombre">{p.usuarios.nombre}</p>
                    <p className="cliente-pago-email">{p.usuarios.email}</p>
                  </td>
                  <td className="transaccion-pago">{p.id_transaccion}</td>
                  <td>{p.pasarela}</td>
                  <td>{p.metodo_pago ?? '—'}</td>
                  <td className="monto-pago">${Number(p.monto).toLocaleString()}</td>
                  <td>{p.fecha_pago.slice(0, 10)}</td>
                  <td>
                    <span
                      className="badge-pago"
                      style={{ backgroundColor: estadoColor[p.estado] ?? '#999' }}
                    >
                      {p.estado}
                    </span>
                  </td>
                  <td>
                    <select
                      className="select-estado-pago"
                      value={p.estado}
                      onChange={(e) => handleEstado(p.id_pago, e.target.value)}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="aprobado">Aprobado</option>
                      <option value="rechazado">Rechazado</option>
                      <option value="reembolsado">Reembolsado</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </>
  );
}