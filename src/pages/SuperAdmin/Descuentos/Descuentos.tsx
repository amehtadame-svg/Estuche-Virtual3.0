import { useState, useEffect } from 'react';
import Header from '../../../components/Header/Header';
import { API } from '../../../api';
import './Descuentos.css';

interface Descuento {
  id_descuento:  number;
  codigo:        string;
  descripcion:   string | null;
  tipo:          string;
  valor:         number;
  minimo_compra: number;
  fecha_inicio:  string;
  fecha_fin:     string;
  usos_maximos:  number | null;
  usos_actuales: number;
  activo:        boolean;
}

const formularioVacio = {
  codigo: '', descripcion: '', tipo: 'porcentaje', valor: '',
  minimo_compra: '', fecha_inicio: '', fecha_fin: '', usos_maximos: '',
};

export default function Descuentos() {
  const [descuentos, setDescuentos]   = useState<Descuento[]>([]);
  const [formulario, setFormulario]   = useState(formularioVacio);
  const [editandoId, setEditandoId]   = useState<number | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [mensaje, setMensaje]         = useState('');
  const token = localStorage.getItem('token');

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const mostrarMensaje = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(''), 2500);
  };

  const cargar = async () => {
    const res = await fetch(API.descuentos, { headers });
    if (res.ok) setDescuentos(await res.json());
  };

  useEffect(() => { cargar(); }, []);

  const cerrarModal = () => {
    setModalAbierto(false);
    setEditandoId(null);
    setFormulario(formularioVacio);
  };

  const handleCambio = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const handleGuardar = async () => {
    if (!formulario.codigo || !formulario.tipo || !formulario.valor || !formulario.fecha_inicio || !formulario.fecha_fin) {
      mostrarMensaje('Completa los campos obligatorios.');
      return;
    }

    const body = {
      ...formulario,
      valor:         Number(formulario.valor),
      minimo_compra: Number(formulario.minimo_compra) || 0,
      usos_maximos:  formulario.usos_maximos ? Number(formulario.usos_maximos) : null,
    };

    const url    = editandoId ? `${API.descuentos}/${editandoId}` : API.descuentos;
    const method = editandoId ? 'PUT' : 'POST';

    const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
    if (res.ok) {
      mostrarMensaje(editandoId ? 'Descuento actualizado.' : 'Descuento creado.');
      cerrarModal();
      cargar();
    }
  };

  const handleEditar = (d: Descuento) => {
    setFormulario({
      codigo:        d.codigo,
      descripcion:   d.descripcion ?? '',
      tipo:          d.tipo,
      valor:         String(d.valor),
      minimo_compra: String(d.minimo_compra),
      fecha_inicio:  d.fecha_inicio.slice(0, 10),
      fecha_fin:     d.fecha_fin.slice(0, 10),
      usos_maximos:  d.usos_maximos ? String(d.usos_maximos) : '',
    });
    setEditandoId(d.id_descuento);
    setModalAbierto(true);
  };

  const handleToggle = async (id: number) => {
    const res = await fetch(`${API.descuentos}/${id}/toggle`, { method: 'PATCH', headers });
    if (res.ok) { mostrarMensaje('Estado actualizado.'); cargar(); }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Eliminar este descuento?')) return;
    const res = await fetch(`${API.descuentos}/${id}`, { method: 'DELETE', headers });
    if (res.ok) { mostrarMensaje('Descuento eliminado.'); cargar(); }
  };

  return (
    <>
      <Header />
      <div className="descuentos-page">

        <div className="descuentos-topbar">
          <h2 className="titulo-descuentos">Gestión de Descuentos</h2>
          <button className="btn-nuevo-descuento" onClick={() => setModalAbierto(true)}>
            + Nuevo descuento
          </button>
        </div>

        {mensaje && <div className="mensaje-descuentos">{mensaje}</div>}

        <div className="table-wrapper">
          <table className="tabla-descuentos">
            <thead>
              <tr>
                <th>Código</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Mín. compra</th>
                <th>Vigencia</th>
                <th>Usos</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {descuentos.map((d) => (
                <tr key={d.id_descuento}>
                  <td className="codigo-descuento">{d.codigo}</td>
                  <td>{d.tipo === 'porcentaje' ? 'Porcentaje' : 'Valor fijo'}</td>
                  <td>{d.tipo === 'porcentaje' ? `${d.valor}%` : `$${Number(d.valor).toLocaleString()}`}</td>
                  <td>${Number(d.minimo_compra).toLocaleString()}</td>
                  <td className="vigencia-descuento">
                    {d.fecha_inicio.slice(0, 10)} → {d.fecha_fin.slice(0, 10)}
                  </td>
                  <td>{d.usos_actuales}{d.usos_maximos ? ` / ${d.usos_maximos}` : ''}</td>
                  <td>
                    <span className={`badge-estado ${d.activo ? 'badge-activo' : 'badge-inactivo'}`}>
                      {d.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="acciones-descuento">
                    <button className="btn-toggle-descuento" onClick={() => handleToggle(d.id_descuento)}>
                      {d.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button className="btn-editar-descuento" onClick={() => handleEditar(d)}>Editar</button>
                    <button className="btn-eliminar-descuento" onClick={() => handleEliminar(d.id_descuento)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {modalAbierto && (
          <div className="modal-overlay-descuento" onClick={cerrarModal}>
            <div className="modal-descuentos" onClick={(e) => e.stopPropagation()}>

              <div className="modal-header-descuento">
                <h3 className="modal-titulo-descuento">
                  {editandoId ? 'Editar descuento' : 'Nuevo descuento'}
                </h3>
                <button className="modal-cerrar-descuento" onClick={cerrarModal}>✕</button>
              </div>

              <div className="modal-body-descuento">
                <p className="label-descuento">Código <span className="required">*</span></p>
                <input className="input-descuento" name="codigo" value={formulario.codigo} onChange={handleCambio} placeholder="Ej: REGRESO10" />

                <p className="label-descuento">Descripción</p>
                <input className="input-descuento" name="descripcion" value={formulario.descripcion} onChange={handleCambio} placeholder="Descripción opcional" />

                <p className="label-descuento">Tipo <span className="required">*</span></p>
                <select className="input-descuento" name="tipo" value={formulario.tipo} onChange={handleCambio}>
                  <option value="porcentaje">Porcentaje</option>
                  <option value="valor_fijo">Valor fijo</option>
                </select>

                <p className="label-descuento">Valor <span className="required">*</span></p>
                <input className="input-descuento" name="valor" type="number" value={formulario.valor} onChange={handleCambio} placeholder={formulario.tipo === 'porcentaje' ? 'Ej: 10' : 'Ej: 5000'} />

                <p className="label-descuento">Compra mínima</p>
                <input className="input-descuento" name="minimo_compra" type="number" value={formulario.minimo_compra} onChange={handleCambio} placeholder="0" />

                <p className="label-descuento">Fecha inicio <span className="required">*</span></p>
                <input className="input-descuento" name="fecha_inicio" type="date" value={formulario.fecha_inicio} onChange={handleCambio} />

                <p className="label-descuento">Fecha fin <span className="required">*</span></p>
                <input className="input-descuento" name="fecha_fin" type="date" value={formulario.fecha_fin} onChange={handleCambio} />

                <p className="label-descuento">Usos máximos</p>
                <input className="input-descuento" name="usos_maximos" type="number" value={formulario.usos_maximos} onChange={handleCambio} placeholder="Sin límite" />
              </div>

              <div className="modal-footer-descuento">
                <button className="btn-cancelar-descuento" onClick={cerrarModal}>Cancelar</button>
                <button className="btn-guardar-descuento"  onClick={handleGuardar}>
                  {editandoId ? 'Guardar cambios' : 'Crear descuento'}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </>
  );
}