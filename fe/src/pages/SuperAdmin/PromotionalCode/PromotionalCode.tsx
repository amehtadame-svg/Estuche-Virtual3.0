import { useState, useEffect } from 'react';
import { API, authHeaders } from '../../../api/api';
import './PromotionalCode.css';

interface PromotionalCode {
  id: string;
  code: string;
  description: string | null;
  type: string;
  value: number;
  minPurchase: number;
  startDate: string;
  endDate: string;
  maxUses: number | null;
  currentUses: number;
  active: boolean;
}

const emptyForm = {
  code: '',
  description: '',
  type: 'percentage',
  value: '',
  minPurchase: '',
  startDate: '',
  endDate: '',
  maxUses: '',
};

export default function PromotionalCode() {
  const [codes, setCodes] = useState<PromotionalCode[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const headers = authHeaders();

  const showMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 2500);
  };

  const load = async () => {
    const res = await fetch(API.promotionalCodes, { headers });
    if (res.ok) setCodes(await res.json());
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const openNewModal = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!form.code || !form.type || !form.value || !form.startDate || !form.endDate) {
      showMessage('Completa los campos obligatorios.');
      return;
    }

    const body = {
      code: form.code,
      description: form.description,
      type: form.type,
      value: Number(form.value),
      minPurchase: Number(form.minPurchase) || 0,
      startDate: form.startDate,
      endDate: form.endDate,
      maxUses: form.maxUses ? Number(form.maxUses) : null,
    };

    const url = editingId ? `${API.promotionalCodes}/${editingId}` : API.promotionalCodes;
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
    if (res.ok) {
      showMessage(editingId ? 'Descuento actualizado.' : 'Descuento creado.');
      closeModal();
      load();
    }
  };

  const handleEdit = (d: PromotionalCode) => {
    setForm({
      code: d.code,
      description: d.description ?? '',
      type: d.type,
      value: String(d.value),
      minPurchase: String(d.minPurchase),
      startDate: d.startDate.slice(0, 10),
      endDate: d.endDate.slice(0, 10),
      maxUses: d.maxUses ? String(d.maxUses) : '',
    });
    setEditingId(d.id);
    setModalOpen(true);
  };

  const handleToggle = async (id: string) => {
    const res = await fetch(`${API.promotionalCodes}/${id}/toggle`, { method: 'PATCH', headers });
    if (res.ok) {
      showMessage('Estado actualizado.');
      load();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este descuento?')) return;
    const res = await fetch(`${API.promotionalCodes}/${id}`, { method: 'DELETE', headers });
    if (res.ok) {
      showMessage('Descuento eliminado.');
      load();
    }
  };

  return (
    <>
      <div className="descuentos-page">
        <div className="descuentos-topbar">
          <h2 className="titulo-descuentos">Gestión de Descuentos</h2>
          <button className="btn-nuevo-descuento" onClick={openNewModal}>
            + Nuevo descuento
          </button>
        </div>

        {message && <div className="mensaje-descuentos">{message}</div>}

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
              {codes.map((d) => (
                <tr key={d.id}>
                  <td className="codigo-descuento">{d.code}</td>
                  <td>{d.type === 'percentage' ? 'Porcentaje' : 'Valor fijo'}</td>
                  <td>{d.type === 'percentage' ? `${d.value}%` : `$${Number(d.value).toLocaleString()}`}</td>
                  <td>${Number(d.minPurchase).toLocaleString()}</td>
                  <td className="vigencia-descuento">
                    {d.startDate.slice(0, 10)} → {d.endDate.slice(0, 10)}
                  </td>
                  <td>
                    {d.currentUses}
                    {d.maxUses ? ` / ${d.maxUses}` : ''}
                  </td>
                  <td>
                    <span className={`badge-estado ${d.active ? 'badge-activo' : 'badge-inactivo'}`}>
                      {d.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="acciones-descuento">
                    <button className="btn-toggle-descuento" onClick={() => handleToggle(d.id)}>
                      {d.active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button className="btn-editar-descuento" onClick={() => handleEdit(d)}>
                      Editar
                    </button>
                    <button className="btn-eliminar-descuento" onClick={() => handleDelete(d.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="modal-overlay-descuento" onClick={closeModal}>
            <div className="modal-descuentos" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-descuento">
                <h3 className="modal-titulo-descuento">{editingId ? 'Editar descuento' : 'Nuevo descuento'}</h3>
                <button className="modal-cerrar-descuento" onClick={closeModal}>
                  ✕
                </button>
              </div>

              <div className="modal-body-descuento">
                <p className="label-descuento">
                  Código <span className="required">*</span>
                </p>
                <input className="input-descuento" name="code" value={form.code} onChange={handleChange} placeholder="Ej: REGRESO10" />

                <p className="label-descuento">Descripción</p>
                <input className="input-descuento" name="description" value={form.description} onChange={handleChange} placeholder="Descripción opcional" />

                <p className="label-descuento">
                  Tipo <span className="required">*</span>
                </p>
                <select className="input-descuento" name="type" value={form.type} onChange={handleChange}>
                  <option value="percentage">Porcentaje</option>
                  <option value="fixed">Valor fijo</option>
                </select>

                <p className="label-descuento">
                  Valor <span className="required">*</span>
                </p>
                <input
                  className="input-descuento"
                  name="value"
                  type="number"
                  value={form.value}
                  onChange={handleChange}
                  placeholder={form.type === 'percentage' ? 'Ej: 10' : 'Ej: 5000'}
                />

                <p className="label-descuento">Compra mínima</p>
                <input className="input-descuento" name="minPurchase" type="number" value={form.minPurchase} onChange={handleChange} placeholder="0" />

                <p className="label-descuento">
                  Fecha inicio <span className="required">*</span>
                </p>
                <input className="input-descuento" name="startDate" type="date" value={form.startDate} onChange={handleChange} />

                <p className="label-descuento">
                  Fecha fin <span className="required">*</span>
                </p>
                <input className="input-descuento" name="endDate" type="date" value={form.endDate} onChange={handleChange} />

                <p className="label-descuento">Usos máximos</p>
                <input className="input-descuento" name="maxUses" type="number" value={form.maxUses} onChange={handleChange} placeholder="Sin límite" />
              </div>

              <div className="modal-footer-descuento">
                <button className="btn-cancelar-descuento" onClick={closeModal}>
                  Cancelar
                </button>
                <button className="btn-guardar-descuento" onClick={handleSave}>
                  {editingId ? 'Guardar cambios' : 'Crear descuento'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
