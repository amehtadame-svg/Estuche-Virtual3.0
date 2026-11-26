import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { API, authHeaders } from '../../api/api';
import Modal from '../../components/ui/Modal';
import { CreditCard, Landmark, ShoppingCart, Smartphone } from 'lucide-react';
import './Checkout.css';

import { useDemoPayment, type PaymentMethod, type Outcome, type PaymentResult } from './useDemoPayment';
import DemoPaymentResult from './DemoPaymentResult';
import { formatCOP } from './paymentFormat';

interface Discount {
  code: string;
  type: string;
  value: number;
}

export default function Checkout() {
  const { user } = useAuth();
  const { items, total, reload, loading: cartLoading } = useCart();
  const navigate = useNavigate();

  const [method, setMethod] =
    useState<PaymentMethod>('tarjeta');

  const payment = useDemoPayment(user?.id);
  const [outcome, setOutcome] = useState<Outcome>('approved');
  const [error, setError] = useState('');
  const { processing } = payment;

  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [addressModalOpen, setAddressModalOpen] =
    useState(false);

  const [addressForm, setAddressForm] = useState({
    contactName: '',
    phoneNumber: '',
    street: '',
    apt: '',
    country: 'Colombia',
    city: '',
    district: '',
    zipCode: '',
  });

  const [addressErrors, setAddressErrors] =
    useState<Record<string, string>>({});

  const [discountCode, setDiscountCode] = useState('');

  const [discount, setDiscount] =
    useState<Discount | null>(null);

  const [discountError, setDiscountError] = useState('');

  const [applyingDiscount, setApplyingDiscount] =
    useState(false);

  const headers = authHeaders();

  const calculateTotal = () => {
    if (!discount) return total;

    if (discount.type === 'percentage') {
      return total * (1 - discount.value / 100);
    }

    if (discount.type === 'fixed') {
      return Math.max(0, total - discount.value);
    }

    return total;
  };

  const finalTotal = calculateTotal();

  useEffect(() => {
    if (!user) return;

    fetch(`${API.users}/${user.id}`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setPhone(data.phone || '');
          setAddress(data.address || '');
        }
      })
      .catch(() => {});
  }, [user]);

  const openAddressModal = () => {
    setAddressErrors({});
    setAddressForm((prev) => ({ ...prev, contactName: prev.contactName || user?.name || '', phoneNumber: phone }));
    setAddressModalOpen(true);
  };

  const closeAddressModal = () => {
    setAddressModalOpen(false);
  };

  const updateAddressField = (
    field: string,
    value: string
  ) => {
    setAddressForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveAddressModal = async () => {
    const errors: Record<string, string> = {};

    if (!addressForm.contactName.trim()) {
      errors.contactName =
        'Por favor, introduce un nombre de contacto.';
    }

    if (
      !/^3\d{9}$/.test(addressForm.phoneNumber.trim())
    ) {
      errors.phoneNumber =
        'Introduce un celular colombiano de 10 dígitos que empiece por 3.';
    }

    if (!addressForm.street.trim()) {
      errors.street = 'Introduce una dirección.';
    }

    if (!addressForm.city.trim()) {
      errors.city = 'Selecciona una ciudad.';
    }

    if (!addressForm.district.trim()) {
      errors.district = 'Selecciona una localidad.';
    }

    if (
      !addressForm.zipCode.trim() ||
      addressForm.zipCode.trim().length < 5
    ) {
      errors.zipCode =
        'Por favor, introduce 5-8 dígitos.';
    }

    if (Object.keys(errors).length > 0) {
      setAddressErrors(errors);
      return;
    }

    const composedAddress = [
      addressForm.street,
      addressForm.apt,
      addressForm.district,
      addressForm.city,
      addressForm.country,
      addressForm.zipCode,
    ]
      .filter(Boolean)
      .join(', ');

    if (composedAddress.length > 255) {
      setAddressErrors({ street: 'La dirección completa no debe superar 255 caracteres.' });
      return;
    }
    // Se guarda en el servidor junto al pedido, en la transacción de checkout.
    setPhone(addressForm.phoneNumber.trim());
    setAddress(composedAddress);
    setAddressModalOpen(false);
  };

  const applyDiscount = async () => {
    if (!discountCode.trim()) return;

    setApplyingDiscount(true);
    setDiscountError('');

    try {
      const res = await fetch(
        `${API.promotionalCodes}/validate`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            code: discountCode.trim(),
            total,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();

        setDiscountError(
          data.message || 'Código inválido'
        );

        setDiscount(null);
        return;
      }

      const data = await res.json();

      setDiscount({
        code: data.code,
        type: data.type,
        value: Number(data.value),
      });

      setDiscountError('');
    } catch {
      setDiscountError(
        'Error al validar el código'
      );
    } finally {
      setApplyingDiscount(false);
    }
  };

  const confirmPayment = async () => {
    if (!payment.retrying && (!phone.trim() || !address.trim())) {
      setError('Completa tu teléfono y dirección de envío.');
      return;
    }
    setError('');
    const result = await payment.start({
      method, outcome, phone, address,
      ...(discount ? { code: discount.code } : {}),
      items: items.map((item) => ({ productId: item.id, quantity: item.quantity })),
    });
    if (result && !(await reload())) {
      setError('El pago se registró, pero no pudimos sincronizar el carrito. Vuelve a consultar o reintenta recuperar el carrito.');
    }
  };

  const retryPayment = async () => {
    setError('');
    if (!(await reload())) {
      setError('No se pudo recuperar el carrito. Intenta nuevamente; no se creará ningún pago.');
      return;
    }
    if (payment.reset()) {
      setOutcome('approved');
      setDiscount(null);
      setDiscountCode('');
      setDiscountError('');
    }
  };

  const syncPayment = async (operation: Promise<PaymentResult | null>) => {
    setError('');
    if (await operation && !(await reload())) setError('El estado se consultó, pero no pudimos sincronizar el carrito. Intenta nuevamente.');
  };

  if (payment.loading) return <main className="empty-state" role="status">Consultando pagos de demostración…</main>;

  if (payment.result) return <DemoPaymentResult
    result={payment.result}
    processing={processing}
    error={payment.error || error}
    notice={payment.notice}
    lastCheckedAt={payment.lastCheckedAt}
    action={payment.action}
    cartSyncing={cartLoading}
    onResolve={(value) => { void syncPayment(payment.resolve(value)); }}
    onRefresh={() => { void syncPayment(payment.refresh()); }}
    onRetry={() => { void retryPayment(); }}
    onLeave={() => { if (payment.reset()) navigate('/catalogo'); }}
  />;

  if (cartLoading) return <main className="empty-state" role="status">Recuperando carrito…</main>;

  if (items.length === 0 && !payment.retrying) {
    return (
      <main className="empty-state">
        <span className="empty-state-icon" aria-hidden="true">
          <ShoppingCart size={34} />
        </span>
        <h1>No hay nada para pagar</h1>
        <p>Tu carrito está vacío. Agrega productos desde el catálogo para continuar.</p>
        <button
          type="button"
          className="ui-btn ui-btn--primary"
          onClick={() => navigate('/catalogo')}
        >
          Ir al catálogo
        </button>
      </main>
    );
  }

  return (
    <div className="pago-container">
      <h1 className="pago-titulo">
        Pago de demostración
      </h1>

      <div className="pago-demo-aviso" role="note">
        <strong>Modo académico · COP · Envío gratis</strong>
        <p>No se harán cobros reales. No introduzcas tarjetas, claves bancarias ni códigos de Nequi.</p>
      </div>
      {!payment.enabled && <p className="pago-error" role="alert">{payment.error || 'La simulación está deshabilitada. Activa NODE_ENV=development y ENABLE_PAYMENT_SIMULATION=true en el backend.'}</p>}
      {payment.retrying && <p className="pago-demo-aviso">Hay un intento guardado. Al reintentar se usarán sus datos originales para evitar pedidos duplicados.</p>}
      <fieldset className="pago-demo-fieldset" disabled={processing || payment.retrying}>
      <legend className="pago-demo-sr-only">Datos de la compra de demostración</legend>
      <div className="pago-body">
        <div className="pago-izq">
          <div className="pago-seccion">
            <h2 className="pago-seccion-titulo">
              Dirección de entrega
            </h2>

            {address && phone ? (
              <div className="pago-dir-resumen">
                <p className="pago-dir-resumen-texto">
                  {address}
                </p>

                <p className="pago-dir-resumen-tel">
                  Tel: {phone}
                </p>

                <button
                  type="button"
                  className="pago-link-btn"
                  onClick={openAddressModal}
                >
                  Editar dirección
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="pago-link-btn"
                onClick={openAddressModal}
              >
                + Añadir nueva dirección
              </button>
            )}
          </div>

          <div className="pago-seccion">
            <h2 className="pago-seccion-titulo">
              Método de pago
            </h2>

            <div className="pago-metodos-lista">
              {(
                [
                  'tarjeta',
                  'nequi',
                  'pse',
                ] as PaymentMethod[]
              ).map((paymentMethod) => (
                <label
                  key={paymentMethod}
                  className={`pago-metodo-fila ${
                    method === paymentMethod
                      ? 'seleccionado'
                      : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="metodo"
                    value={paymentMethod}
                    checked={method === paymentMethod}
                    onChange={() =>
                      setMethod(paymentMethod)
                    }
                  />

                  <span className="pago-metodo-radio" />

                  <span className="pago-metodo-icono" aria-hidden="true">
                    {paymentMethod === 'tarjeta' ? (
                      <CreditCard size={20} />
                    ) : paymentMethod === 'nequi' ? (
                      <Smartphone size={20} />
                    ) : (
                      <Landmark size={20} />
                    )}
                  </span>

                  <span className="pago-metodo-label">
                    {paymentMethod === 'pse' ? 'PSE' : paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="pago-seccion">
            <label className="pago-form-label" htmlFor="demo-outcome">Resultado que quieres demostrar</label>
            <select id="demo-outcome" className="pago-descuento-input" value={outcome} onChange={(e) => setOutcome(e.target.value as Outcome)}>
              <option value="approved">Aprobado</option>
              <option value="rejected">Rechazado</option>
              <option value="pending">Pendiente</option>
            </select>
            <p className="pago-seguro">Los tres métodos son simulados. No necesitas una cuenta bancaria.</p>
          </div>
          <div className="pago-seccion">
            <h2 className="pago-seccion-titulo">
              Productos
            </h2>

            <div className="pago-resumen">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="pago-linea"
                >
                  <span>
                    {item.name} ×{item.quantity}
                  </span>

                  <span>
                    {formatCOP(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pago-der">
          <div className="pago-resumen-card">
            <h2 className="pago-seccion-titulo">
              Resumen
            </h2>

            <div className="pago-linea">
              <span>
                Subtotal
              </span>

              <span>
                {formatCOP(total)}
              </span>
            </div>

            <div className="pago-descuento-wrap">
              <input
                className="pago-descuento-input"
                placeholder="Código de descuento"
                value={discountCode}
                onChange={(e) =>
                  setDiscountCode(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    void applyDiscount();
                  }
                }}
              />

              <button
                className="pago-descuento-btn"
                onClick={applyDiscount}
                disabled={applyingDiscount}
              >
                {applyingDiscount ? '...' : 'Aplicar'}
              </button>
            </div>

            {discountError && (
              <p className="pago-error-desc">
                {discountError}
              </p>
            )}

            {discount && (
              <div className="pago-linea pago-linea-descuento">
                <span>
                  Descuento ({discount.code})
                </span>

                <span>
                  -
                  {discount.type === 'percentage'
                    ? `${discount.value}%`
                    : formatCOP(discount.value)}
                </span>
              </div>
            )}

            <div className="pago-linea"><span>Envío</span><strong>Gratis</strong></div>
            <div className="pago-total">
              <span>
                Total
              </span>

              <span>
                {formatCOP(finalTotal)} COP
              </span>
            </div>

            <p className="pago-seguro">El importe definitivo se calcula en el servidor con los precios y descuentos vigentes.</p>
          </div>
        </div>
      </div>

      </fieldset>
      {(error || payment.error) && <p className="pago-error" role="alert">{error || payment.error}</p>}
      <div className="pago-demo-acciones">
        <button className="pago-btn-confirmar" onClick={() => { void confirmPayment(); }} disabled={processing || !payment.enabled}>
          {processing ? 'Procesando simulación…' : payment.retrying ? 'Reintentar el mismo pago' : `Simular pago por ${formatCOP(finalTotal)} COP`}
        </button>
      </div>

      {addressModalOpen && (
        <Modal
          titulo="Editar dirección"
          onClose={closeAddressModal}
          footer={
            <>
              <button
                type="button"
                className="pago-btn-secundario"
                onClick={closeAddressModal}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="pago-btn-confirmar"
                onClick={saveAddressModal}
              >
                Guardar
              </button>
            </>
          }
        >
          <h3 className="pago-modal-subtitulo">
            Información personal
          </h3>

          <div className="pago-modal-fila">
            <div className="pago-modal-campo">
              <input
                className={`pago-modal-input ${
                  addressErrors.contactName
                    ? 'con-error'
                    : ''
                }`}
                placeholder="Nombre de contacto*"
                value={addressForm.contactName}
                onChange={(e) =>
                  updateAddressField(
                    'contactName',
                    e.target.value
                  )
                }
              />

              {addressErrors.contactName && (
                <p className="pago-modal-error">
                  {addressErrors.contactName}
                </p>
              )}
            </div>

            <div className="pago-modal-campo">
              <div
                className={`pago-modal-input-prefijo ${
                  addressErrors.phoneNumber
                    ? 'con-error'
                    : ''
                }`}
              >
                <span className="pago-modal-prefijo">
                  +57
                </span>

                <input
                  className="pago-modal-input-sin-borde"
                  placeholder="Número de teléfono*"
                  value={addressForm.phoneNumber}
                  onChange={(e) =>
                    updateAddressField(
                      'phoneNumber',
                      e.target.value
                    )
                  }
                />
              </div>

              {addressErrors.phoneNumber && (
                <p className="pago-modal-error">
                  {addressErrors.phoneNumber}
                </p>
              )}
            </div>
          </div>

          <h3 className="pago-modal-subtitulo">
            Dirección
          </h3>

          <div className="pago-modal-fila">
            <div className="pago-modal-campo">
              <input
                className={`pago-modal-input ${
                  addressErrors.street
                    ? 'con-error'
                    : ''
                }`}
                placeholder="Nombre de la calle, apartado postal, etc."
                value={addressForm.street}
                onChange={(e) =>
                  updateAddressField(
                    'street',
                    e.target.value
                  )
                }
              />

              {addressErrors.street && (
                <p className="pago-modal-error">
                  {addressErrors.street}
                </p>
              )}
            </div>

            <div className="pago-modal-campo">
              <input
                className="pago-modal-input"
                placeholder="Apto., suite, unidad, etc. (opcional)"
                value={addressForm.apt}
                onChange={(e) =>
                  updateAddressField(
                    'apt',
                    e.target.value
                  )
                }
              />

              <p className="pago-modal-hint">
                Por favor, indica tu apto., suite,
                unidad, etc. (opcional)
              </p>
            </div>
          </div>

          <div className="pago-modal-fila pago-modal-fila-4">
            <div className="pago-modal-campo">
              <select
                className="pago-modal-input"
                value={addressForm.country}
                onChange={(e) =>
                  updateAddressField(
                    'country',
                    e.target.value
                  )
                }
              >
                <option value="Colombia">
                  🇨🇴 Colombia
                </option>
              </select>
            </div>

            <div className="pago-modal-campo">
              <select
                className={`pago-modal-input ${
                  addressErrors.city
                    ? 'con-error'
                    : ''
                }`}
                value={addressForm.city}
                onChange={(e) =>
                  updateAddressField(
                    'city',
                    e.target.value
                  )
                }
              >
                <option value="">
                  Ciudad
                </option>
                <option value="Bogotá, D.C.">
                  Bogotá, D.C.
                </option>
                <option value="Medellín">
                  Medellín
                </option>
                <option value="Cali">
                  Cali
                </option>
                <option value="Barranquilla">
                  Barranquilla
                </option>
              </select>

              {addressErrors.city && (
                <p className="pago-modal-error">
                  {addressErrors.city}
                </p>
              )}
            </div>

            <div className="pago-modal-campo">
              <select
                className={`pago-modal-input ${
                  addressErrors.district
                    ? 'con-error'
                    : ''
                }`}
                value={addressForm.district}
                onChange={(e) =>
                  updateAddressField(
                    'district',
                    e.target.value
                  )
                }
              >
                <option value="">
                  Localidad
                </option>
                <option value="Fontibón">
                  Fontibón
                </option>
                <option value="Chapinero">
                  Chapinero
                </option>
                <option value="Suba">
                  Suba
                </option>
                <option value="Kennedy">
                  Kennedy
                </option>
              </select>

              {addressErrors.district && (
                <p className="pago-modal-error">
                  {addressErrors.district}
                </p>
              )}
            </div>

            <div className="pago-modal-campo">
              <input
                className={`pago-modal-input ${
                  addressErrors.zipCode
                    ? 'con-error'
                    : ''
                }`}
                placeholder="Código postal"
                value={addressForm.zipCode}
                onChange={(e) =>
                  updateAddressField(
                    'zipCode',
                    e.target.value
                  )
                }
              />

              {addressErrors.zipCode && (
                <p className="pago-modal-error">
                  {addressErrors.zipCode}
                </p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}