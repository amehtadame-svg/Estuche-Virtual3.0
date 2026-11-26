import { useCallback, useEffect, useState } from 'react';
import { deliveryApi, date } from '../Employee/employeeApi';
import { shortReference } from '../../lib/reference';
import '../Employee/Employee.css';

type Delivery = { id: string; address: string | null; shipDate?: string; order: { id: string; customer: { fullName: string; phone: string | null } | null } };
export default function DeliveryWorkspace() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try { setDeliveries(await deliveryApi<Delivery[]>('/despatches')); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudieron cargar las entregas.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const confirm = async (id: string) => {
    if (!window.confirm('¿Confirmas que el cliente recibió el pedido?')) return;
    setBusy(id); setError('');
    try { await deliveryApi(`/despatches/${id}/confirm`, {}); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo confirmar la entrega.'); }
    finally { setBusy(null); }
  };
  return <main className="emp-shell"><h1>Mis entregas</h1><p>Solo aparecen los envíos operativos asignados a tu cuenta. Confirma la entrega únicamente cuando el cliente reciba el pedido.</p>
    <button onClick={() => void load()} disabled={loading}>Actualizar</button>
    {error && <p className="emp-error" role="alert">{error}</p>}
    {loading ? <p role="status">Cargando…</p> : !deliveries.length ? <p>No tienes entregas pendientes.</p> : deliveries.map(d => <section className="emp-panel" key={d.id}>
      <h2>Pedido {shortReference(d.order.id)}</h2><p>Despachado: {date(d.shipDate)}</p><p>Cliente: {d.order.customer?.fullName || '—'}</p><p>Teléfono: {d.order.customer?.phone || '—'}</p><p>Dirección: {d.address || '—'}</p>
      <button disabled={busy !== null} onClick={() => void confirm(d.id)}>{busy === d.id ? 'Confirmando…' : 'Confirmar entrega'}</button>
    </section>)}
    <small>Se muestran hasta 100 envíos en tránsito.</small>
  </main>;
}
