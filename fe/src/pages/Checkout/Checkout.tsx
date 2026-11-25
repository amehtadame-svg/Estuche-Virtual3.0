import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { API, authHeaders } from '../../api/api';
import Modal from '../../components/ui/Modal';
import { Banknote, CheckCircle2, CreditCard, Landmark, ShoppingCart, Smartphone } from 'lucide-react';
import './Checkout.css';

type PaymentMethod =
  | 'tarjeta'
  | 'nequi'
  | 'daviplata'
  | 'transferencia'
  | 'efectivo';

interface Discount {
  code: string;
  type: string;
  value: number;
}

export default function Checkout() {
  const { user } = useAuth();
  const { items, total, clear } = useCart();
  const navigate = useNavigate();

  const [method, setMethod] =
    useState<PaymentMethod>('tarjeta');

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [createdOrderId, setCreatedOrderId] =
    useState<string | null>(null);

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

    fetch(`${API.users}/${user.id}`, { headers })
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
      !addressForm.phoneNumber.trim() ||
      addressForm.phoneNumber.trim().length < 10
    ) {
      errors.phoneNumber =
        'Por favor, introduce 10-11 dígitos.';
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

    const newPhone = addressForm.phoneNumber;

    await fetch(`${API.users}/${user?.id}/profile`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        phone: newPhone,
        address: composedAddress,
      }),
    });

    setPhone(newPhone);
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
    if (items.length === 0) return;

    if (createdOrderId) {
      setError(
        `El pedido ${createdOrderId} ya fue creado. Verifica su recibo con administración antes de volver a comprar.`
      );
      return;
    }

    if (!phone.trim() || !address.trim()) {
      setError(
        'Por favor completa tu teléfono y dirección de envío.'
      );
      return;
    }

    setProcessing(true);
    setError('');

    try {
      await fetch(`${API.users}/${user?.id}/profile`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          phone,
          address,
        }),
      });

      let promotionalCodeId: string | null = null;

      if (discount) {
        const resApply = await fetch(
          `${API.promotionalCodes}/apply`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              code: discount.code,
            }),
          }
        );

        if (resApply.ok) {
          const data = await resApply.json();
          promotionalCodeId = data.id;
        }
      }

      const resOrder = await fetch(API.orders, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          total: finalTotal,
          ...(promotionalCodeId
            ? { promotionalCodeId }
            : {}),
          status: 'pending',
          details: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            unitPrice: item.price,
          })),
        }),
      });

      if (!resOrder.ok) {
        const data = await resOrder
          .json()
          .catch(() => null);

        setError(
          data?.message || 'No se pudo crear el pedido.'
        );
        return;
      }

      const order = await resOrder.json();

      setCreatedOrderId(order.id);

      const resReceipt = await fetch(API.receipts, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customerId: user?.id,
          orderId: order.id,
          total: finalTotal,
          paymentStatus: 'pending',
        }),
      });

      if (!resReceipt.ok) {
        throw new Error(
          `El pedido ${order.id} fue creado, pero no se pudo confirmar su recibo. Contacta a administración y no repitas la compra.`
        );
      }

      await clear();
      setSuccess(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Error de conexión. Verifica si se creó el pedido antes de reintentar.'
      );
    } finally {
      setProcessing(false);
    }
  };

  if (items.length === 0 && !success) {
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

  if (success) {
    return (
      <div className="pago-exito">
        <div className="pago-exito-icono" aria-hidden="true">
          <CheckCircle2 size={56} strokeWidth={1.75} />
        </div>

        <h2>
          Pedido registrado, pendiente de pago
        </h2>

        <p>
          Tu pedido y su recibo fueron registrados.
          Todavía no se ha procesado ningún pago.
        </p>

        <button
          className="pago-btn-confirmar"
          onClick={() => navigate('/')}
        >
          Volver al inicio
        </button>

        <button
          className="pago-btn-secundario"
          onClick={() => navigate('/catalogo')}
        >
          Seguir comprando
        </button>
      </div>
    );
  }

  return (
    <div className="pago-container">
      <h1 className="pago-titulo">
        Confirmar pedido
      </h1>

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
                  'daviplata',
                  'transferencia',
                  'efectivo',
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
                    ) : paymentMethod === 'nequi' || paymentMethod === 'daviplata' ? (
                      <Smartphone size={20} />
                    ) : paymentMethod === 'transferencia' ? (
                      <Landmark size={20} />
                    ) : (
                      <Banknote size={20} />
                    )}
                  </span>

                  <span className="pago-metodo-label">
                    {paymentMethod.charAt(0).toUpperCase() +
                      paymentMethod.slice(1)}
                  </span>
                </label>
              ))}
            </div>
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
                    $
                    {(
                      item.price * item.quantity
                    ).toLocaleString()}
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
                ${total.toLocaleString()}
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
                    : `$${discount.value.toLocaleString()}`}
                </span>
              </div>
            )}

            <div className="pago-total">
              <span>
                Total
              </span>

              <span>
                ${finalTotal.toLocaleString()}
              </span>
            </div>

            {error && (
              <p className="pago-error">
                {error}
              </p>
            )}

            <button
              className="pago-btn-confirmar"
              onClick={confirmPayment}
              disabled={processing}
            >
              {processing
                ? 'Procesando...'
                : `Registrar pedido por $${finalTotal.toLocaleString()}`}
            </button>

            <p className="pago-seguro">
              El pago simulado todavía no está habilitado.
            </p>
          </div>
        </div>
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