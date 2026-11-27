import { useEffect, useState, type FormEvent } from 'react';
import { CreditCard, ShoppingCart, Tag, Undo2, UserPlus, Wallet, type LucideIcon } from 'lucide-react';
import { API, authHeaders } from '../../../api/api';
import { notify } from '../../../lib/notifications';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import './Reports.css';

const chartTooltip = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  color: 'var(--text-h)',
};

interface Report {
  id: string;
  date: string;
  totalOrders: number;
  deliveredOrders: number;
  canceledOrders: number;
  totalSold: number;
  totalPaid: number;
  totalRefunded: number;
  productsSold: number;
  newCustomers: number;
}

interface Summary {
  total_sold: number;
  total_paid: number;
  total_refunded: number;
  active_promotional_codes: number;
  orders_today: number;
  new_customers_today: number;
  total_orders?: number;
  products_sold?: number;
  average_ticket?: number;
}

const INVALID_RANGE_MSG =
  'Rango no válido: La fecha de inicio no puede ser posterior a la fecha final';

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [todayReports, setTodayReports] = useState<Report[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const loadReports = async (from = '', to = '') => {
    setLoading(true);
    const headers = authHeaders();
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString() ? `?${params.toString()}` : '';

    try {
      const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit',
      }).format(new Date());
      const [r1, r2, r3] = await Promise.all([
        fetch(`${API.reports}${qs}`, { headers }),
        fetch(`${API.reports}/summary${qs}`, { headers }),
        fetch(`${API.reports}?from=${today}&to=${today}`, { headers }),
      ]);

      if (!r1.ok || !r2.ok || !r3.ok) {
        const err = await (!r1.ok ? r1 : !r2.ok ? r2 : r3).json().catch(() => null);
        notify.error(err?.message ?? 'No se pudieron cargar los reportes.');
        return;
      }

      const [rowsData, summaryData, todayData] = await Promise.all([r1.json(), r2.json(), r3.json()]);
      setReports(Array.isArray(rowsData) ? rowsData : []);
      setTodayReports(Array.isArray(todayData) ? todayData.filter((row: Report) => row.date.slice(0, 10) === today) : []);
      setSummary(summaryData);
    } catch {
      notify.error('Error de conexión al cargar los reportes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleFilterSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (fromDate && toDate && fromDate > toDate) {
      notify.error(INVALID_RANGE_MSG);
      return;
    }
    loadReports(fromDate, toDate);
  };

  const handleClearFilter = () => {
    setFromDate('');
    setToDate('');
    loadReports();
  };

  const last6 = [...reports].slice(0, 6).reverse();
  const stats: { label: string; value: string; icon: LucideIcon; color: string }[] = summary
    ? [
        { label: 'Total vendido', value: `$${Number(summary.total_sold).toLocaleString()}`, icon: Wallet, color: 'stat-purple' },
        { label: 'Total pagado', value: `$${Number(summary.total_paid).toLocaleString()}`, icon: CreditCard, color: 'stat-blue' },
        { label: 'Reembolsos', value: `$${Number(summary.total_refunded).toLocaleString()}`, icon: Undo2, color: 'stat-green' },
        { label: 'Descuentos activos', value: String(summary.active_promotional_codes), icon: Tag, color: 'stat-orange' },
        { label: 'Pedidos hoy', value: String(summary.orders_today), icon: ShoppingCart, color: 'stat-blue' },
        { label: 'Clientes nuevos hoy', value: String(summary.new_customers_today), icon: UserPlus, color: 'stat-purple' },
      ]
    : [];

  return (
    <div className="reportes-page">
      <div className="reportes-topbar">
        <div>
          <h2 className="titulo-reportes">Reportes Financieros</h2>
          <p className="subtitulo-usuarios">
            Métricas consolidadas en tiempo real a partir de pedidos, pagos, devoluciones y clientes
          </p>
        </div>
      </div>

        <form className="reportes-filtro-fechas" onSubmit={handleFilterSubmit}>
          <label className="reportes-fecha-campo">
            <span>Desde</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              aria-label="Fecha inicial"
            />
          </label>
          <label className="reportes-fecha-campo">
            <span>Hasta</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              aria-label="Fecha final"
            />
          </label>
          <button type="submit" className="reportes-btn-filtrar">
            Generar reporte
          </button>
          {(fromDate || toDate) && (
            <button type="button" className="reportes-btn-limpiar" onClick={handleClearFilter}>
              Limpiar
            </button>
          )}
        </form>

      {/* Stats en tiempo real */}
      {summary && (
        <div className="stats-grid reportes-stats">
          {stats.map((s) => (
            <div key={s.label} className={`stat-card ${s.color}`}>
              <span className="stat-icon" aria-hidden="true"><s.icon size={20} /></span>
              <div>
                <p className="stat-value">{s.value}</p>
                <p className="stat-label">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="reportes-graficas">
        {/* Ventas vs Pagos */}
        <div className="chart-section">
          <h2 className="section-heading">Ventas vs Pagos</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={last6}>
              <defs>
                <linearGradient id="gVentas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#b026ea" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#b026ea" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gPagos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted)' }} stroke="var(--border)" tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} stroke="var(--border)" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, '']} contentStyle={chartTooltip} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--muted)' }} />
              <Area type="monotone" dataKey="totalSold" name="Vendido" stroke="#b026ea" strokeWidth={2} fill="url(#gVentas)" />
              <Area type="monotone" dataKey="totalPaid" name="Pagado" stroke="#10b981" strokeWidth={2} fill="url(#gPagos)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pedidos */}
        <div className="chart-section">
          <h2 className="section-heading">Pedidos por día</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={last6}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted)' }} stroke="var(--border)" tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} stroke="var(--border)" />
              <Tooltip contentStyle={chartTooltip} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--muted)' }} />
              <Bar dataKey="totalOrders" name="Total" fill="#b026ea" radius={[4, 4, 0, 0]} />
              <Bar dataKey="deliveredOrders" name="Entregados" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="canceledOrders" name="Cancelados" fill="#e74c3c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Reembolsos */}
        <div className="chart-section">
          <h2 className="section-heading">Reembolsos</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={last6}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted)' }} stroke="var(--border)" tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} stroke="var(--border)" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Reembolsos']} contentStyle={chartTooltip} />
              <Bar dataKey="totalRefunded" name="Reembolsado" fill="#e74c3c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="reportes-tabla-section">
        <h2 className="section-heading">Detalle de hoy</h2>
        <p>Esta tabla muestra únicamente los registros del día en Colombia; los filtros afectan las gráficas y el resumen.</p>
        {loading ? (
          <p style={{ color: 'var(--text)', margin: 0 }}>Calculando reportes…</p>
        ) : todayReports.length === 0 ? (
          <p style={{ color: 'var(--text)', margin: 0 }}>No hay registros para el día de hoy.</p>
        ) : (
          <div className="table-wrapper">
            <table className="tabla-reportes">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Pedidos</th>
                  <th>Entregados</th>
                  <th>Cancelados</th>
                  <th>Vendido</th>
                  <th>Pagado</th>
                  <th>Reembolsado</th>
                  <th>Productos vendidos</th>
                  <th>Clientes nuevos</th>
                </tr>
              </thead>
              <tbody>
                {todayReports.map((r) => (
                  <tr key={r.id}>
                    <td className="fecha-reporte">{r.date.slice(0, 10)}</td>
                    <td>{r.totalOrders}</td>
                    <td className="entregados-reporte">{r.deliveredOrders}</td>
                    <td className="cancelados-reporte">{r.canceledOrders}</td>
                    <td className="vendido-reporte">${Number(r.totalSold).toLocaleString('es-CO')}</td>
                    <td>${Number(r.totalPaid).toLocaleString('es-CO')}</td>
                    <td className="reembolsado-reporte">${Number(r.totalRefunded).toLocaleString('es-CO')}</td>
                    <td>{r.productsSold}</td>
                    <td>{r.newCustomers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
