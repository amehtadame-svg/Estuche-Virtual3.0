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

export function useDemoPayment(userId: string | undefined) {
  const storageKey = `estuche-demo-payment:${userId}`;
  const attempt = useRef<Attempt | null>(null);
  const busy = useRef(false);
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState('');
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setEnabled(false);
    setResult(null);
    setError('');
    setRetrying(false);
    attempt.current = null;
    async function restore() {
      try {
        const config = await fetch(`${API.payments}/config`, { headers: authHeaders() });
        if (!config.ok) throw new Error('No se pudo consultar la disponibilidad de pagos.');
        const settings = await config.json();
        if (!active) return;
        setEnabled(settings.enabled);
        if (!settings.enabled) return;
        const saved = sessionStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved) as Attempt;
          if (!parsed.requestKey) { sessionStorage.removeItem(storageKey); return; }
          attempt.current = parsed;
          const res = await fetch(`${API.payments}/demo/${parsed.requestKey}`, { headers: authHeaders() });
          if (!active) return;
          if (res.ok) setResult(await res.json());
          else if (res.status === 404) setRetrying(true);
          else throw new Error('No se pudo recuperar el pago. Recarga la página antes de volver a comprar.');
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'No se pudo recuperar el pago.');
          // No iniciar otra compra si el resultado anterior es desconocido.
          setEnabled(false);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void restore();
    return () => { active = false; };
  }, [storageKey]);

  async function start(input: CheckoutInput) {
    if (busy.current) return null;
    busy.current = true;
    setProcessing(true);
    setError('');
    try {
      const payload = attempt.current ?? { ...input, requestKey: crypto.randomUUID() };
      // Guardar antes de la petición: un corte de red no debe duplicar el pedido.
      sessionStorage.setItem(storageKey, JSON.stringify(payload));
      attempt.current = payload;
      setRetrying(true);
      const res = await fetch(`${API.payments}/demo/checkout`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 400 || res.status === 422) {
          attempt.current = null;
          sessionStorage.removeItem(storageKey);
          setRetrying(false);
        }
        throw new Error(paymentErrorMessage(data));
      }
      setResult(data);
      return data as PaymentResult;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión. Reintenta para recuperar el mismo pago.');
      return null;
    } finally {
      busy.current = false;
      setProcessing(false);
    }
  }

  async function resolve(outcome: 'approved' | 'rejected') {
    if (busy.current || !attempt.current) return;
    busy.current = true;
    setProcessing(true);
    setError('');
    try {
      const res = await fetch(`${API.payments}/demo/${attempt.current.requestKey}/resolve`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify({ outcome }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'No se pudo actualizar el pago.');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión. Consulta el estado antes de reintentar.');
    } finally {
      busy.current = false;
      setProcessing(false);
    }
  }

  async function refresh() {
    if (!attempt.current || busy.current) return;
    busy.current = true;
    setProcessing(true);
    setError('');
    try {
      const res = await fetch(`${API.payments}/demo/${attempt.current.requestKey}`, { headers: authHeaders() });
      if (!res.ok) throw new Error('No se pudo consultar el pago.');
      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión.');
    } finally { busy.current = false; setProcessing(false); }
  }

  function reset() {
    sessionStorage.removeItem(storageKey);
    attempt.current = null;
    setResult(null);
    setRetrying(false);
    setError('');
  }

  return { result, loading, enabled, error, processing, retrying, start, resolve, refresh, reset };
}
