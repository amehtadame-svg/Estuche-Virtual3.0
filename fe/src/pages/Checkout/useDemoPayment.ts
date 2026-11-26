import { useEffect, useRef, useState } from 'react';
import { API, authHeaders } from '../../api/api';
import { paymentErrorMessage } from './paymentFormat';

export type PaymentMethod = 'tarjeta' | 'pse' | 'nequi';
export type Outcome = 'approved' | 'rejected' | 'pending';
export interface PaymentResult {
  reference: string;
  status: Outcome;
  method: PaymentMethod;
  amount: string;
  shippingCost?: string | number;
  currency: string;
  orderId: string;
  orderStatus: string;
  receiptNumber: number;
  expiresAt: string | null;
}
interface CheckoutInput {
  method: PaymentMethod;
  outcome: Outcome;
  address: string;
  phone: string;
  code?: string;
  items: { productId: string; quantity: number }[];
}
type Attempt = CheckoutInput & { requestKey: string };
export type PaymentAction = 'checkout' | 'refresh' | 'resolve' | null;

export function isPaymentClosed(result: PaymentResult, now = Date.now()) {
  return result.status !== 'pending' || result.orderStatus === 'canceled' ||
    (result.expiresAt !== null && new Date(result.expiresAt).getTime() <= now);
}

export function useDemoPayment(userId: string | undefined) {
  const storageKey = `estuche-demo-payment:${userId}`;
  const attempt = useRef<Attempt | null>(null);
  const latestResult = useRef<PaymentResult | null>(null);
  const busy = useRef(false);
  const scope = useRef(0);
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<PaymentAction>(null);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const [retrying, setRetrying] = useState(false);

  function accept(data: PaymentResult) {
    // Solo los pendientes y resultados desconocidos deben bloquear otra compra.
    // Conservar la referencia en memoria permite consultar el comprobante actual.
    if (isPaymentClosed(data)) sessionStorage.removeItem(storageKey);
    latestResult.current = data;
    setResult(data);
    setRetrying(false);
    setLastCheckedAt(new Date());
  }

  useEffect(() => {
    const currentScope = ++scope.current;
    const controller = new AbortController();
    busy.current = false;
    attempt.current = null;
    latestResult.current = null;
    setLoading(true);
    setEnabled(false);
    setResult(null);
    setError('');
    setNotice('');
    setLastCheckedAt(null);
    setRetrying(false);
    setAction(null);
    async function restore() {
      try {
        if (!userId) return;
        const config = await fetch(`${API.payments}/config`, { headers: authHeaders(), signal: controller.signal });
        if (!config.ok) throw new Error('No se pudo consultar la disponibilidad de pagos.');
        const settings = await config.json();
        if (currentScope !== scope.current) return;
        setEnabled(settings.enabled);
        if (!settings.enabled) return;
        const saved = sessionStorage.getItem(storageKey);
        if (!saved) return;
        const parsed = JSON.parse(saved) as Attempt;
        if (!parsed.requestKey) throw new Error('No se pudo verificar el intento guardado. Contacta con soporte antes de repetir la compra.');
        attempt.current = parsed;
        const res = await fetch(`${API.payments}/demo/${parsed.requestKey}`, { headers: authHeaders(), signal: controller.signal });
        if (currentScope !== scope.current) return;
        if (res.ok) {
          const restored: PaymentResult = await res.json();
          if (currentScope !== scope.current) return;
          if (isPaymentClosed(restored)) {
            // Compatibilidad con comprobantes definitivos guardados por versiones anteriores.
            sessionStorage.removeItem(storageKey);
            attempt.current = null;
          } else {
            latestResult.current = restored;
            setResult(restored);
            setLastCheckedAt(new Date());
          }
        } else if (res.status === 404) {
          setRetrying(true); // Reusar la misma clave si el POST anterior no llegó al servidor.
        } else throw new Error('No se pudo recuperar el pago. Recarga la página antes de volver a comprar.');
      } catch (err) {
        if (currentScope === scope.current) {
          setError(err instanceof Error && !(err instanceof TypeError) ? err.message : 'No se pudo conectar para recuperar el pago. Recarga la página.');
          setEnabled(false);
        }
      } finally {
        if (currentScope === scope.current) setLoading(false);
      }
    }
    void restore();
    return () => { scope.current = currentScope + 1; controller.abort(); };
  }, [storageKey, userId]);

  async function start(input: CheckoutInput): Promise<PaymentResult | null> {
    if (busy.current || !enabled || latestResult.current) return null;
    const currentScope = scope.current;
    busy.current = true;
    setAction('checkout');
    setError('');
    setNotice('');
    try {
      const payload = attempt.current ?? { ...input, requestKey: crypto.randomUUID() };
      sessionStorage.setItem(storageKey, JSON.stringify(payload));
      attempt.current = payload;
      setRetrying(true);
      const res = await fetch(`${API.payments}/demo/checkout`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (currentScope !== scope.current) return null;
      if (!res.ok) {
        if (res.status === 400 || res.status === 422) {
          attempt.current = null;
          sessionStorage.removeItem(storageKey);
          setRetrying(false);
        }
        throw new Error(paymentErrorMessage(data));
      }
      accept(data);
      return data;
    } catch (err) {
      if (currentScope === scope.current) setError(err instanceof Error && !(err instanceof TypeError)
        ? err.message : 'Error de conexión. Reintenta el mismo pago para recuperar su resultado sin duplicarlo.');
      return null;
    } finally {
      if (currentScope === scope.current) { busy.current = false; setAction(null); }
    }
  }

  async function resolve(outcome: 'approved' | 'rejected'): Promise<PaymentResult | null> {
    if (busy.current || !attempt.current) return null;
    const currentScope = scope.current;
    busy.current = true;
    setAction('resolve');
    setError('');
    setNotice('');
    try {
      const res = await fetch(`${API.payments}/demo/${attempt.current.requestKey}/resolve`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify({ outcome }),
      });
      const data = await res.json();
      if (currentScope !== scope.current) return null;
      if (!res.ok) throw new Error(data.message || 'No se pudo actualizar el pago.');
      accept(data);
      setNotice(outcome === 'approved' ? 'Aprobación simulada registrada.' : 'Rechazo registrado. Los productos vuelven a tu carrito para que puedas reintentar.');
      return data;
    } catch (err) {
      if (currentScope === scope.current) setError(err instanceof Error && !(err instanceof TypeError)
        ? err.message : 'Error de conexión. Consulta el estado antes de reintentar.');
      return null;
    } finally {
      if (currentScope === scope.current) { busy.current = false; setAction(null); }
    }
  }

  async function refresh(): Promise<PaymentResult | null> {
    if (!attempt.current || busy.current) return null;
    const currentScope = scope.current;
    busy.current = true;
    setAction('refresh');
    setError('');
    setNotice('');
    const previous = latestResult.current;
    try {
      const res = await fetch(`${API.payments}/demo/${attempt.current.requestKey}`, { headers: authHeaders(), cache: 'no-store' });
      if (!res.ok) throw new Error('No se pudo consultar el pago. Intenta nuevamente.');
      const data: PaymentResult = await res.json();
      if (currentScope !== scope.current) return null;
      accept(data);
      setNotice(previous?.status === data.status && previous?.orderStatus === data.orderStatus
        ? 'Consulta completada. No hay cambios en el estado del pago.' : 'Consulta completada. El estado del pago se actualizó.');
      return data;
    } catch (err) {
      if (currentScope === scope.current) setError(err instanceof Error && !(err instanceof TypeError)
        ? err.message : 'No se pudo conectar con el servidor. Tu comprobante sigue disponible; vuelve a consultar.');
      return null;
    } finally {
      if (currentScope === scope.current) { busy.current = false; setAction(null); }
    }
  }

  function reset() {
    // No descartar un intento desconocido o pendiente: podría haber un pedido creado.
    if (busy.current || !latestResult.current || !isPaymentClosed(latestResult.current)) return false;
    sessionStorage.removeItem(storageKey);
    attempt.current = null;
    latestResult.current = null;
    setResult(null);
    setRetrying(false);
    setError('');
    setNotice('');
    setLastCheckedAt(null);
    return true;
  }

  return { result, loading, enabled, error, notice, lastCheckedAt, action,
    processing: action !== null, retrying, start, resolve, refresh, reset };
}
