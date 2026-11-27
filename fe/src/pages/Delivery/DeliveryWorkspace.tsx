import { useCallback, useEffect, useState } from 'react';
import { deliveryApi, date } from '../Employee/employeeApi';
import { shortReference } from '../../lib/reference';
import '../Employee/Employee.css';

type Pending = { id: string; orderDate: string; itemCount: number };
type Delivery = { id: string; address: string | null; shipDate?: string; order: { id: string; customer: { fullName: string; phone: string | null } | null } };
export default function DeliveryWorkspace() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [available, mine] = await Promise.all([deliveryApi<Pending[]>('/pending-orders'), deliveryApi<Delivery[]>('/despatches')]);
      setPending(available); setDeliveries(mine); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudieron cargar las entregas.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const claim = async (id: string) => {
    if (!window.confirm('¿Quieres tomar este pedido para entregarlo?')) return;
    setBusy(id); setError(''); setMessage('');
    try { await deliveryApi(`/pending-orders/${id}/claim`, {}); await load(); setMessage('Pedido tomado. Consulta la dirección en Mis entregas.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo tomar el pedido.'); }
    finally { setBusy(null); }
  };
  const confirm = async (id: string) => {
    if (!window.confirm('¿Confirmas que el cliente recibió el pedido?')) return;
    setBusy(id); setError(''); setMessage('');
    try { await deliveryApi(`/despatches/${id}/confirm`, {}); await load(); setMessage('Entrega confirmada.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo confirmar la entrega.'); }
    finally { setBusy(null); }
  };
  return <main className="emp-shell"><h1>Repartidor</h1><button onClick={() => void load()} disabled={loading}>Actualizar</button>
    {error && <p className="emp-error" role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    {loading && <p role="status">Cargando…</p>}
    <section><h2>Pedidos pendientes</h2><p>Pedidos pagados y empacados que puedes tomar para llevar.</p>
      {!loading && !pending.length && <p>No hay pedidos disponibles.</p>}
      {pending.map(p => <article className="emp-panel" key={p.id}><h3>Pedido {shortReference(p.id)}</h3><p>Fecha: {date(p.orderDate)} · Productos: {p.itemCount}</p><button disabled={busy !== null} onClick={() => void claim(p.id)}>{busy === p.id ? 'Tomando…' : 'Tomar pedido'}</button></article>)}
      <small>Se muestran hasta 100 pedidos disponibles.</small>
    </section>
    <section><h2>Mis entregas</h2><p>Confirma únicamente cuando el cliente reciba su pedido.</p>
      {!loading && !deliveries.length && <p>No tienes entregas asignadas.</p>}
      {deliveries.map(d => <article className="emp-panel" key={d.id}><h3>Pedido {shortReference(d.order.id)}</h3><p>Tomado: {date(d.shipDate)}</p><p>Cliente: {d.order.customer?.fullName || '—'}</p><p>Teléfono: {d.order.customer?.phone || '—'}</p><p>Dirección: {d.address || '—'}</p><button disabled={busy !== null} onClick={() => void confirm(d.id)}>{busy === d.id ? 'Confirmando…' : 'Confirmar entrega'}</button></article>)}
      <small>Se muestran hasta 100 envíos en tránsito.</small>
    </section>
  </main>;
}
