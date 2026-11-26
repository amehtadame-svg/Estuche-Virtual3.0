import AccountNav from '../../components/layout/AccountNav';
import { shortReference } from '../../lib/reference';
import {
  useEffect,
  useState,
} from 'react';
import {
  employeeApi as api,
  money,
  date,
  labels,
} from './employeeApi';
import type { Job } from './employeeApi';
import './Employee.css';

export default function CustomerPickups() {
  const [orders, setOrders] = useState<Job[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(
    null
  );

  const [codes, setCodes] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    const controller = new AbortController();

    api<Job[]>(
      '/my-pickups',
      undefined,
      'GET',
      controller.signal
    )
      .then(setOrders)
      .catch((reason) => {
        if (!controller.signal.aborted) {
          setError(reason.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  const issue = async (id: string) => {
    setBusy(id);
    setError('');

    try {
      const result = await api<{
        code: string;
      }>(
        `/orders/${id}/pickup-code`,
        {}
      );

      setCodes((current) => ({
        ...current,
        [id]: result.code,
      }));
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'No se pudo generar el código.'
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="emp-shell">
      <AccountNav />
      <h1>Mis retiros en tienda</h1>

      <p>
        Cuando el pedido esté pagado y empacado,
        genera tu código y muéstralo al empleado.
        Generar otro invalida el anterior.
        No lo compartas públicamente.
      </p>

      {error && (
        <p
          className="emp-alert emp-error"
          role="alert"
        >
          {error}
        </p>
      )}

      {loading && (
        <p role="status">
          Cargando…
        </p>
      )}

      {!loading && !orders.length && (
        <p>
          No tienes pedidos con retiro en tienda.
        </p>
      )}

      {orders.map((order) => (
        <section
          className="emp-panel"
          key={order.id}
        >
          <h2>
            Pedido {shortReference(order.id)}
          </h2>

          <p>
            {date(order.orderDate)}
            {' · '}
            {money(order.total)}
            {' · '}
            {labels[order.status || 'pending']}
          </p>

          <p>
            Preparación:{' '}
            {
              labels[order.work?.status || ''] ||
              'Todavía no asignada'
            }
          </p>

          {order.work?.status === 'packed' &&
            order.status === 'preparing' && (
              <button
                disabled={busy !== null}
                onClick={() =>
                  void issue(order.id)
                }
              >
                {busy === order.id
                  ? 'Generando…'
                  : codes[order.id]
                    ? 'Generar otro código'
                    : 'Obtener código de retiro'}
              </button>
            )}

          {codes[order.id] && (
            <output
              className="emp-code"
              aria-live="polite"
            >
              {codes[order.id]}
            </output>
          )}
        </section>
      ))}

      <small>
        Se muestran los últimos 50 pedidos de retiro.
        El servidor vuelve a verificar su estado antes
        de emitir un código.
      </small>
    </main>
  );
}