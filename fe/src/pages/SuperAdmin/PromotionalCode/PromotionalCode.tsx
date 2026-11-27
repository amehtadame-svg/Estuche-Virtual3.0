import { useState, useEffect } from 'react';
import { API, authHeaders } from '../../../api/api';
import { runApiAction } from '../../../lib/apiAction';
import Modal from '../../../components/ui/Modal';
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
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const headers = authHeaders();

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch(API.promotionalCodes, { headers });
      if (!response.ok) throw new Error();
      const data: unknown = await response.json();
      if (!Array.isArray(data)) throw new Error();
      setCodes(data);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeModal = () => {
    setFormError('');
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const openNewModal = () => {
    setFormError('');
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setFormError('');
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSave = async () => {
    const missingFields = [
      !form.code.trim() && 'código',
      !form.type && 'tipo',
      !form.value && 'valor',
      !form.startDate && 'fecha de inicio',
      !form.endDate && 'fecha de fin',
    ].filter(Boolean);
    if (missingFields.length) {
      setFormError(`Completa los campos obligatorios: ${missingFields.join(', ')}.`);
      return;
    }
    setFormError('');

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
    setFormError('');
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
      successTitle: nextActive ? 'Descuento activado' : 'Descuento desactivado',
      errorMessage: 'No se pudo actualizar el estado del descuento.',
    });

    if (!response) return;

    await load();
  };

  const query = search.trim().toLocaleLowerCase();
  const filteredCodes = codes.filter(discount =>
    (filter === 'all' || discount.active === (filter === 'active')) &&
    [discount.code, discount.description ?? ''].some(value => value.toLocaleLowerCase().includes(query))
  );

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

        <div className="sa-controles">
          <input className="sa-busqueda" type="search" aria-label="Buscar descuentos" placeholder="Buscar por código o descripción..." value={search} onChange={e => setSearch(e.target.value)} />
          <div className="sa-filtros" aria-label="Filtrar descuentos por estado">
            {[{ value: 'all', label: 'Todos' }, { value: 'active', label: 'Activos' }, { value: 'inactive', label: 'Inactivos' }].map(option => (
              <button type="button" key={option.value} className={`sa-filtro ${filter === option.value ? 'sa-filtro-activo' : ''}`} aria-pressed={filter === option.value} onClick={() => setFilter(option.value)}>{option.label}</button>
            ))}
          </div>
        </div>
        {loading && <p role="status">Cargando descuentos...</p>}
        {loadError && <p role="alert">No se pudieron cargar los descuentos. <button type="button" onClick={load}>Reintentar</button></p>}
        {!loading && !loadError && <div className="table-wrapper">
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
              {filteredCodes.length === 0 && (<tr><td colSpan={8} className="table-empty">{codes.length === 0 ? 'Todavía no hay códigos de descuento.' : 'No se encontraron descuentos con esos filtros.'}</td></tr>)}
              {filteredCodes.map((discount) => (
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
                    <button className="btn-editar-descuento" onClick={() => handleEdit(discount)}>Editar</button>
                    <button className={`btn-toggle-descuento ${discount.active ? '' : 'is-reactivate'}`} onClick={() => handleToggle(discount)}>
                      {discount.active ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}

        {modalOpen && (
          <Modal titulo={editingId ? 'Editar descuento' : 'Nuevo descuento'} onClose={closeModal} footer={<>
            <button className="btn-cancelar-descuento" onClick={closeModal}>Cancelar</button>
            <button className="btn-guardar-descuento" onClick={handleSave}>{editingId ? 'Guardar cambios' : 'Crear descuento'}</button>
          </>}>
                {formError && (
                  <p className="error-formulario-descuento" role="alert">{formError}</p>
                )}
                <label className="label-descuento" htmlFor="discount-code">
                  Código <span className="required">*</span>
                </label>
                <input
                  className="input-descuento"
                  id="discount-code" name="code" maxLength={50}
                  value={form.code}
                  onChange={handleChange}
                  placeholder="Ej: REGRESO10"
                />

                <label className="label-descuento" htmlFor="discount-description">Descripción</label>
                <input
                  className="input-descuento"
                  id="discount-description" name="description" maxLength={500}
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Descripción opcional"
                />

                <label className="label-descuento" htmlFor="discount-type">
                  Tipo <span className="required">*</span>
                </label>
                <select
                  className="input-descuento"
                  id="discount-type" name="type"
                  value={form.type}
                  onChange={handleChange}
                >
                  <option value="percentage">Porcentaje</option>
                  <option value="fixed">Valor fijo</option>
                </select>

                <label className="label-descuento" htmlFor="discount-value">
                  Valor <span className="required">*</span>
                </label>
                <input
                  className="input-descuento"
                  id="discount-value" name="value"
                  type="number"
                  min="0"
                  value={form.value}
                  onChange={handleChange}
                  placeholder={
                    form.type === 'percentage' ? 'Ej: 10' : 'Ej: 5000'
                  }
                />

                <label className="label-descuento" htmlFor="discount-minPurchase">Compra mínima</label>
                <input
                  className="input-descuento"
                  id="discount-minPurchase" name="minPurchase"
                  type="number"
                  min="0"
                  value={form.minPurchase}
                  onChange={handleChange}
                  placeholder="0"
                />

                <label className="label-descuento" htmlFor="discount-startDate">
                  Fecha inicio <span className="required">*</span>
                </label>
                <input
                  className="input-descuento"
                  id="discount-startDate" name="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={handleChange}
                />

                <label className="label-descuento" htmlFor="discount-endDate">
                  Fecha fin <span className="required">*</span>
                </label>
                <input
                  className="input-descuento"
                  id="discount-endDate" name="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={handleChange}
                />
          </Modal>
        )}
      </div>
    </>
  );
}
