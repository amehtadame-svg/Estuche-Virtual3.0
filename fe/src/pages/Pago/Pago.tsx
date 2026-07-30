import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { API } from '../../api/api';
import Modal from '../../components/ui/Modal';
import './Pago.css';

type MetodoPago = 'tarjeta' | 'nequi' | 'daviplata' | 'transferencia' | 'efectivo';

interface Descuento {
  codigo: string;
  tipo: string;
  valor: number;
}

export default function Pago() {
  const { user } = useAuth();
  const { items, total, vaciar } = useCart();
  const navigate = useNavigate();

  const [metodo, setMetodo] = useState<MetodoPago>('tarjeta');
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  // Datos de contacto y envío (viven directamente en la tabla usuarios)
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');

  // Modal de dirección
  const [modalDireccionAbierto, setModalDireccionAbierto] = useState(false);
  const [formDir, setFormDir] = useState({
    nombreContacto: '',
    telefonoNum: '',
    calle: '',
    apto: '',
    pais: 'Colombia',
    ciudad: '',
    localidad: '',
    codigoPostal: '',
  });
  const [erroresDir, setErroresDir] = useState<Record<string, string>>({});

  const [codigoDesc, setCodigoDesc] = useState('');
  const [descuento, setDescuento] = useState<Descuento | null>(null);
  const [errorDesc, setErrorDesc] = useState('');
  const [aplicandoDesc, setAplicandoDesc] = useState(false);

  const token = localStorage.getItem('token');
  const hdrs = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Calcular total con descuento
  const calcularTotal = () => {
    if (!descuento) return total;
    if (descuento.tipo === 'porcentaje') return total * (1 - descuento.valor / 100);
    if (descuento.tipo === 'valor_fijo') return Math.max(0, total - descuento.valor);
    return total;
  };

  const totalFinal = calcularTotal();

  // Precargar teléfono y dirección del usuario si ya los tiene guardados
  useEffect(() => {
    if (!user) return;
    fetch(`${API.usuarios}/${user.id}`, { headers: hdrs })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setTelefono(data.telefono || '');
          setDireccion(data.direccion || '');
        }
      })
      .catch(() => { });
  }, [user]);

  const abrirModalDireccion = () => {
    setErroresDir({});
    setModalDireccionAbierto(true);
  };

  const cerrarModalDireccion = () => {
    setModalDireccionAbierto(false);
  };

  const actualizarCampoDir = (campo: string, valor: string) => {
    setFormDir(prev => ({ ...prev, [campo]: valor }));
  };

  const guardarDireccionModal = async () => {
  const errores: Record<string, string> = {};
  if (!formDir.nombreContacto.trim()) errores.nombreContacto = 'Por favor, introduce un nombre de contacto.';
  if (!formDir.telefonoNum.trim() || formDir.telefonoNum.trim().length < 10) errores.telefonoNum = 'Por favor, introduce 10-11 dígitos.';
  if (!formDir.calle.trim()) errores.calle = 'Introduce una dirección.';
  if (!formDir.ciudad.trim()) errores.ciudad = 'Selecciona una ciudad.';
  if (!formDir.localidad.trim()) errores.localidad = 'Selecciona una localidad.';
  if (!formDir.codigoPostal.trim() || formDir.codigoPostal.trim().length < 5) errores.codigoPostal = 'Por favor, introduce 5-8 dígitos.';

  if (Object.keys(errores).length > 0) {
    setErroresDir(errores);
    return;
  }

  const direccionCompuesta = [
    formDir.calle,
    formDir.apto,
    formDir.localidad,
    formDir.ciudad,
    formDir.pais,
    formDir.codigoPostal,
  ].filter(Boolean).join(', ');

  const nuevoTelefono = formDir.telefonoNum;

  // Guardar en BD inmediatamente
  await fetch(`${API.usuarios}/${user?.id}/perfil`, {
    method: 'PATCH',
    headers: hdrs,
    body: JSON.stringify({ telefono: nuevoTelefono, direccion: direccionCompuesta }),
  });
   const res = await fetch(`${API.usuarios}/${user?.id}/perfil`, {
    method: 'PATCH',
    headers: hdrs,
    body: JSON.stringify({ telefono: nuevoTelefono, direccion: direccionCompuesta }),
  });

  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Respuesta:', data);

  setTelefono(nuevoTelefono);
  setDireccion(direccionCompuesta);
  setModalDireccionAbierto(false);
};

  const aplicarDescuento = async () => {
    if (!codigoDesc.trim()) return;
    setAplicandoDesc(true);
    setErrorDesc('');
    try {
      const res = await fetch(`${API.descuentos}/validar`, {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({ codigo: codigoDesc.trim(), total }),
      });
      if (!res.ok) {
        const d = await res.json();
        setErrorDesc(d.message || 'Código inválido');
        setDescuento(null);
        return;
      }
      const d = await res.json();
      setDescuento(d);
      setErrorDesc('');
    } catch {
      setErrorDesc('Error al validar el código');
    } finally {
      setAplicandoDesc(false);
    }
  };

  const confirmarPago = async () => {
    if (items.length === 0) return;

    if (!telefono.trim() || !direccion.trim()) {
      setError('Por favor completa tu teléfono y dirección de envío.');
      return;
    }

    setProcesando(true);
    setError('');

    try {
      // 0. Guardar teléfono y dirección en el perfil del usuario
      await fetch(`${API.usuarios}/${user?.id}/perfil`, {
        method: 'PATCH',
        headers: hdrs,
        body: JSON.stringify({ telefono, direccion }),
      });

      // 1. Obtener id_descuento y registrar uso
      let id_descuento = null;
      if (descuento) {
        const resAplicar = await fetch(`${API.descuentos}/aplicar`, {
          method: 'POST',
          headers: hdrs,
          body: JSON.stringify({ codigo: descuento.codigo }),
        });
        if (resAplicar.ok) {
          const d = await resAplicar.json();
          id_descuento = d.id_descuento;
        }
      }

      // 2. Crear pedido
      const resPedido = await fetch(API.pedidos, {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({
          total: totalFinal,
          id_descuento,
          estado: 'pendiente',
          detalles: items.map(item => ({
            id_producto: item.id,
            cantidad: item.cantidad,
            precio: item.precio,
          })),
        }),
      });
      if (!resPedido.ok) {
        const d = await resPedido.json().catch(() => null);
        setError(d?.message || 'No se pudo crear el pedido.');
        return;
      }

      const pedido = await resPedido.json();

      // 2. Crear factura asociada al pedido
      const resFactura = await fetch(API.facturas, {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({
          id_cliente: user?.id,
          id_pedido: pedido.id_pedido,
          total: totalFinal,
          estado_pago: 'pendiente',
        }),
      });

      let id_factura: number | null = null;
      if (resFactura.ok) {
        const factura = await resFactura.json();
        id_factura = factura.id_factura;
      }

      // 3. Registrar pago simulado
      if (id_factura) {
        const id_transaccion = `SIM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        await fetch(API.pagos, {
          method: 'POST',
          headers: hdrs,
          body: JSON.stringify({
            id_factura,
            id_usuario: user?.id,
            pasarela: 'simulado',
            id_transaccion,
            estado: 'aprobado',
            metodo_pago: metodo,
            monto: totalFinal,
            moneda: 'COP',
            fecha_confirmacion: new Date().toISOString(),
          }),
        });

        // 4. Actualizar factura a pagada
        await fetch(`${API.facturas}/${id_factura}`, {
          method: 'PUT',
          headers: hdrs,
          body: JSON.stringify({ estado_pago: 'pagado' }),
        });
      }

      // 5. Limpiar carrito y mostrar éxito
      await vaciar();
      setExito(true);

    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setProcesando(false);
    }
  };

  if (items.length === 0 && !exito) {
    return (
      <div className="pago-vacio">
        <p>No tienes productos en el carrito.</p>
        <button onClick={() => navigate('/catalogo')}>Ir al catálogo</button>
      </div>
    );
  }

  if (exito) {
    return (
      <div className="pago-exito">
        <div className="pago-exito-icono">✅</div>
        <h2>¡Pedido confirmado!</h2>
        <p>Tu pago fue procesado exitosamente. Recibirás tu pedido pronto.</p>
        <button className="pago-btn-confirmar" onClick={() => navigate('/')}>
          Volver al inicio
        </button>
        <button className="pago-btn-secundario" onClick={() => navigate('/catalogo')}>
          Seguir comprando
        </button>
      </div>
    );
  }

  return (
    <div className="pago-container">
      <h1 className="pago-titulo">Confirmar pedido</h1>

      <div className="pago-body">

        {/* Columna izquierda — detalles */}
        <div className="pago-izq">

          {/* Datos de contacto y envío */}
          <div className="pago-seccion">
            <h2 className="pago-seccion-titulo">Dirección de entrega</h2>

            {direccion && telefono ? (
              <div className="pago-dir-resumen">
                <p className="pago-dir-resumen-texto">{direccion}</p>
                <p className="pago-dir-resumen-tel">Tel: {telefono}</p>
                <button type="button" className="pago-link-btn" onClick={abrirModalDireccion}>
                  Editar dirección
                </button>
              </div>
            ) : (
              <button type="button" className="pago-link-btn" onClick={abrirModalDireccion}>
                + Añadir nueva dirección
              </button>
            )}
          </div>

          {/* Método de pago */}
          <div className="pago-seccion">
            <h2 className="pago-seccion-titulo">Método de pago</h2>
            <div className="pago-metodos-lista">
              {(['tarjeta', 'nequi', 'daviplata', 'transferencia', 'efectivo'] as MetodoPago[]).map(m => (
                <label key={m} className={`pago-metodo-fila ${metodo === m ? 'seleccionado' : ''}`}>
                  <input
                    type="radio"
                    name="metodo"
                    value={m}
                    checked={metodo === m}
                    onChange={() => setMetodo(m)}
                  />
                  <span className="pago-metodo-radio" />
                  <span className="pago-metodo-icono">
                    {m === 'tarjeta' ? '💳' : m === 'nequi' ? '📱' : m === 'daviplata' ? '📲' : m === 'transferencia' ? '🏦' : '💵'}
                  </span>
                  <span className="pago-metodo-label">
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Resumen productos */}
          <div className="pago-seccion">
            <h2 className="pago-seccion-titulo">Productos</h2>
            <div className="pago-resumen">
              {items.map(item => (
                <div key={item.id} className="pago-linea">
                  <span>{item.icono} {item.nombre} ×{item.cantidad}</span>
                  <span>${(item.precio * item.cantidad).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Columna derecha — resumen */}
        <div className="pago-der">
          <div className="pago-resumen-card">
            <h2 className="pago-seccion-titulo">Resumen</h2>

            <div className="pago-linea">
              <span>Subtotal</span>
              <span>${total.toLocaleString()}</span>
            </div>

            {/* Código de descuento */}
            <div className="pago-descuento-wrap">
              <input
                className="pago-descuento-input"
                placeholder="Código de descuento"
                value={codigoDesc}
                onChange={e => setCodigoDesc(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && aplicarDescuento()}
              />
              <button
                className="pago-descuento-btn"
                onClick={aplicarDescuento}
                disabled={aplicandoDesc}
              >
                {aplicandoDesc ? '...' : 'Aplicar'}
              </button>
            </div>
            {errorDesc && <p className="pago-error-desc">{errorDesc}</p>}
            {descuento && (
              <div className="pago-linea pago-linea-descuento">
                <span>Descuento ({descuento.codigo})</span>
                <span>
                  -{descuento.tipo === 'porcentaje'
                    ? `${descuento.valor}%`
                    : `$${descuento.valor.toLocaleString()}`}
                </span>
              </div>
            )}

            <div className="pago-total">
              <span>Total</span>
              <span>${totalFinal.toLocaleString()}</span>
            </div>

            {error && <p className="pago-error">{error}</p>}

            <button
              className="pago-btn-confirmar"
              onClick={confirmarPago}
              disabled={procesando}
            >
              {procesando ? 'Procesando...' : `Pagar $${totalFinal.toLocaleString()}`}
            </button>

            <p className="pago-seguro">🔒 Pago 100% seguro y simulado</p>
          </div>
        </div>

      </div>

      {/* Modal de dirección */}
      {modalDireccionAbierto && (
        <Modal
          titulo="Editar dirección"
          onClose={cerrarModalDireccion}
          footer={
            <>
              <button type="button" className="pago-btn-secundario" onClick={cerrarModalDireccion}>
                Cancelar
              </button>
              <button type="button" className="pago-btn-confirmar" onClick={guardarDireccionModal}>
                Guardar
              </button>
            </>
          }
        >
          <h3 className="pago-modal-subtitulo">Personal Information</h3>
          <div className="pago-modal-fila">
            <div className="pago-modal-campo">
              <input
                className={`pago-modal-input ${erroresDir.nombreContacto ? 'con-error' : ''}`}
                placeholder="Nombre de contacto*"
                value={formDir.nombreContacto}
                onChange={e => actualizarCampoDir('nombreContacto', e.target.value)}
              />
              {erroresDir.nombreContacto && <p className="pago-modal-error">{erroresDir.nombreContacto}</p>}
            </div>
            <div className="pago-modal-campo">
              <div className={`pago-modal-input-prefijo ${erroresDir.telefonoNum ? 'con-error' : ''}`}>
                <span className="pago-modal-prefijo">+57</span>
                <input
                  className="pago-modal-input-sin-borde"
                  placeholder="Número de teléfono*"
                  value={formDir.telefonoNum}
                  onChange={e => actualizarCampoDir('telefonoNum', e.target.value)}
                />
              </div>
              {erroresDir.telefonoNum && <p className="pago-modal-error">{erroresDir.telefonoNum}</p>}
            </div>
          </div>

          <h3 className="pago-modal-subtitulo">Address</h3>
          <div className="pago-modal-fila">
            <div className="pago-modal-campo">
              <input
                className={`pago-modal-input ${erroresDir.calle ? 'con-error' : ''}`}
                placeholder="Nombre de la calle, PO Box, etc."
                value={formDir.calle}
                onChange={e => actualizarCampoDir('calle', e.target.value)}
              />
              {erroresDir.calle && <p className="pago-modal-error">{erroresDir.calle}</p>}
            </div>
            <div className="pago-modal-campo">
              <input
                className="pago-modal-input"
                placeholder="Apto., suite, unidad, etc. (opcional)"
                value={formDir.apto}
                onChange={e => actualizarCampoDir('apto', e.target.value)}
              />
              <p className="pago-modal-hint">Por favor, indica tu apto., suite, unidad, etc. (opcional)</p>
            </div>
          </div>

          <div className="pago-modal-fila pago-modal-fila-4">
            <div className="pago-modal-campo">
              <select
                className="pago-modal-input"
                value={formDir.pais}
                onChange={e => actualizarCampoDir('pais', e.target.value)}
              >
                <option value="Colombia">🇨🇴 Colombia</option>
              </select>
            </div>
            <div className="pago-modal-campo">
              <select
                className={`pago-modal-input ${erroresDir.ciudad ? 'con-error' : ''}`}
                value={formDir.ciudad}
                onChange={e => actualizarCampoDir('ciudad', e.target.value)}
              >
                <option value="">Ciudad</option>
                <option value="Bogotá, D.C.">Bogotá, D.C.</option>
                <option value="Medellín">Medellín</option>
                <option value="Cali">Cali</option>
                <option value="Barranquilla">Barranquilla</option>
              </select>
              {erroresDir.ciudad && <p className="pago-modal-error">{erroresDir.ciudad}</p>}
            </div>
            <div className="pago-modal-campo">
              <select
                className={`pago-modal-input ${erroresDir.localidad ? 'con-error' : ''}`}
                value={formDir.localidad}
                onChange={e => actualizarCampoDir('localidad', e.target.value)}
              >
                <option value="">Localidad</option>
                <option value="Fontibón">Fontibón</option>
                <option value="Chapinero">Chapinero</option>
                <option value="Suba">Suba</option>
                <option value="Kennedy">Kennedy</option>
              </select>
              {erroresDir.localidad && <p className="pago-modal-error">{erroresDir.localidad}</p>}
            </div>
            <div className="pago-modal-campo">
              <input
                className={`pago-modal-input ${erroresDir.codigoPostal ? 'con-error' : ''}`}
                placeholder="Código postal"
                value={formDir.codigoPostal}
                onChange={e => actualizarCampoDir('codigoPostal', e.target.value)}
              />
              {erroresDir.codigoPostal && <p className="pago-modal-error">{erroresDir.codigoPostal}</p>}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}