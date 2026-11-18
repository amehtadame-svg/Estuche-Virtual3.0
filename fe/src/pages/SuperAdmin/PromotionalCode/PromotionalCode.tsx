import { useState, useEffect } from 'react';
import { API, authHeaders } from '../../../api/api';
import { runApiAction } from '../../../lib/apiAction';
import { notify } from '../../../lib/notifications';
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
};

export default function PromotionalCode() {
  const [codes, setCodes] = useState<PromotionalCode[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const headers = authHeaders();

  const load = async () => {
    const response = await fetch(API.promotionalCodes, { headers });
    if (response.ok) {
      setCodes(await response.json());
    } else {
      notify.error('No se pudieron cargar los descuentos.');
    }
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

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSave = async () => {
    if (
      !form.code.trim() ||
      !form.type ||
      !form.value ||
      !form.startDate ||
      !form.endDate
    ) {
      notify.error('Completa los campos obligatorios del descuento.');
      return;
    }

    const body = {
      code: form.code.trim(),
      description: form.description.trim(),
      type: form.type,
      value: Number(form.value),
      minPurchase: Number(form.minPurchase) || 0,
      startDate: form.startDate,
      endDate: form.endDate,
    };

    const editing = editingId !== null;
    const response = await runApiAction({
      url: editing
        ? `${API.promotionalCodes}/${editingId}`
        : API.promotionalCodes,
      init: {
        method: editing ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(body),
      },
      successMessage: editing
        ? 'Descuento actualizado exitosamente.'
        : 'Descuento creado exitosamente.',
      errorMessage: 'No se pudo guardar el descuento.',
    });

    if (!response) return;

    closeModal();
    await load();
  };

  const handleEdit = (discount: PromotionalCode) => {
    setForm({
      code: discount.code,
      description: discount.description ?? '',
      type: discount.type,
      value: String(discount.value),
      minPurchase: String(discount.minPurchase ?? 0),
      startDate: discount.startDate.slice(0, 10),
      endDate: discount.endDate.slice(0, 10),
    });
    setEditingId(discount.id);
    setModalOpen(true);
  };

  const handleToggle = async (discount: PromotionalCode) => {
    const nextActive = !discount.active;

    const response = await runApiAction({
      url: `${API.promotionalCodes}/${discount.id}/toggle`,
      init: {
        method: 'PATCH',
        headers,
      },
      successMessage: nextActive
        ? `Descuento "${discount.code}" activado exitosamente.`
        : `Descuento "${discount.code}" desactivado exitosamente.`,
      errorMessage: 'No se pudo actualizar el estado del descuento.',
    });

    if (!response) return;

    await load();
  };

  return (
    <>
      <div className="descuentos-page">
        <div className="descuentos-topbar">
          <h2 className="titulo-descuentos">Gestión de Descuentos</h2>

          <button
            className="btn-nuevo-descuento"
            onClick={openNewModal}
          >
            + Nuevo descuento
          </button>
        </div>

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
              {codes.map((discount) => (
                <tr key={discount.id}>
                  <td className="codigo-descuento">{discount.code}</td>
                  <td>
                    {discount.type === 'percentage'
                      ? 'Porcentaje'
                      : 'Valor fijo'}
                  </td>
                  <td>
                    {discount.type === 'percentage'
                      ? `${discount.value}%`
                      : `$${Number(discount.value).toLocaleString()}`}
                  </td>
                  <td>
                    ${Number(discount.minPurchase).toLocaleString()}
                  </td>
                  <td className="vigencia-descuento">
                    {discount.startDate.slice(0, 10)} →{' '}
                    {discount.endDate.slice(0, 10)}
                  </td>
                  <td>{discount.currentUses}</td>
                  <td>
                    <span
                      className={`badge-estado ${
                        discount.active ? 'badge-activo' : 'badge-inactivo'
                      }`}
                    >
                      {discount.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="acciones-descuento">
                    <button
                      className="btn-toggle-descuento"
                      onClick={() => handleToggle(discount)}
                    >
                      {discount.active ? 'Desactivar' : 'Activar'}
                    </button>

                    <button
                      className="btn-editar-descuento"
                      onClick={() => handleEdit(discount)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {modalOpen && (
          <div
            className="modal-overlay-descuento"
            onClick={closeModal}
          >
            <div
              className="modal-descuentos"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="modal-header-descuento">
                <h3 className="modal-titulo-descuento">
                  {editingId ? 'Editar descuento' : 'Nuevo descuento'}
                </h3>

                <button
                  className="modal-cerrar-descuento"
                  onClick={closeModal}
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>

              <div className="modal-body-descuento">
                <p className="label-descuento">
                  Código <span className="required">*</span>
                </p>
                <input
                  className="input-descuento"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="Ej: REGRESO10"
                />

                <p className="label-descuento">Descripción</p>
                <input
                  className="input-descuento"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Descripción opcional"
                />

                <p className="label-descuento">
                  Tipo <span className="required">*</span>
                </p>
                <select
                  className="input-descuento"
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                >
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
                  min="0"
                  value={form.value}
                  onChange={handleChange}
                  placeholder={
                    form.type === 'percentage' ? 'Ej: 10' : 'Ej: 5000'
                  }
                />

                <p className="label-descuento">Compra mínima</p>
                <input
                  className="input-descuento"
                  name="minPurchase"
                  type="number"
                  min="0"
                  value={form.minPurchase}
                  onChange={handleChange}
                  placeholder="0"
                />

                <p className="label-descuento">
                  Fecha inicio <span className="required">*</span>
                </p>
                <input
                  className="input-descuento"
                  name="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={handleChange}
                />

                <p className="label-descuento">
                  Fecha fin <span className="required">*</span>
                </p>
                <input
                  className="input-descuento"
                  name="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={handleChange}
                />
              </div>

              <div className="modal-footer-descuento">
                <button
                  className="btn-cancelar-descuento"
                  onClick={closeModal}
                >
                  Cancelar
                </button>

                <button
                  className="btn-guardar-descuento"
                  onClick={handleSave}
                >
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