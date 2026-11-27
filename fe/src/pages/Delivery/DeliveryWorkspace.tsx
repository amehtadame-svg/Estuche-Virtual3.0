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
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [available, mine] = await Promise.all([deliveryApi<Pending[]>('/pending-orders'), deliveryApi<Delivery[]>('/despatches')]);
      setPending(available); setDeliveries(mine); setError(''); setLoadError(false);
    } catch (e) { setLoadError(true); setError(e instanceof Error ? e.message : 'No se pudieron cargar las entregas.'); }
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
  return <main className="emp-shell staff-workspace delivery-workspace">
    <header className="emp-heading">
      <div>
        <h1>Repartidor</h1>
        <p>Gestiona los pedidos disponibles y tus entregas asignadas.</p>
      </div>
      <button type="button" className="staff-header-action" onClick={() => void load()} disabled={loading}>Actualizar</button>
    </header>
    {error && <p className="emp-error" role="alert">{error}</p>}
    {message && <p className="delivery-notice" role="status">{message}</p>}
    {loading && <p role="status">Cargando…</p>}
    {!loading && !loadError && <div className="delivery-sections">
      <section className="delivery-section" aria-labelledby="pending-title">
        <div className="delivery-section-heading"><div><h2 id="pending-title">Pedidos pendientes</h2><p>Pedidos pagados y empacados que puedes tomar para llevar.</p></div><span className="delivery-count">{pending.length} disponibles</span></div>
        {!pending.length && <p className="delivery-empty">No hay pedidos disponibles.</p>}
        <div className="delivery-card-list">{pending.map(p => <article className="delivery-card" key={p.id}>
          <div><h3>Pedido {shortReference(p.id)}</h3><p>Fecha: {date(p.orderDate)} · Productos: {p.itemCount}</p></div>
          <button type="button" className="emp-primary" disabled={busy !== null} onClick={() => void claim(p.id)}>{busy === p.id ? 'Tomando…' : 'Tomar pedido'}</button>
        </article>)}</div>
        <small>Se muestran hasta 100 pedidos disponibles.</small>
      </section>
      <section className="delivery-section" aria-labelledby="deliveries-title">
        <div className="delivery-section-heading"><div><h2 id="deliveries-title">Mis entregas</h2><p>Confirma únicamente cuando el cliente reciba su pedido.</p></div><span className="delivery-count">{deliveries.length} en tránsito</span></div>
        {!deliveries.length && <p className="delivery-empty">No tienes entregas asignadas.</p>}
        <div className="delivery-card-list">{deliveries.map(d => <article className="delivery-card" key={d.id}>
          <div><h3>Pedido {shortReference(d.order.id)}</h3><p>Tomado: {date(d.shipDate)}</p><p>Cliente: {d.order.customer?.fullName || '—'}</p><p>Teléfono: {d.order.customer?.phone || '—'}</p><p>Dirección: {d.address || '—'}</p></div>
          <button type="button" className="emp-primary" disabled={busy !== null} onClick={() => void confirm(d.id)}>{busy === d.id ? 'Confirmando…' : 'Confirmar entrega'}</button>
        </article>)}</div>
        <small>Se muestran hasta 100 envíos en tránsito.</small>
      </section>
    </div>}
  </main>;
}
