import { useEffect, useState, type FormEvent } from 'react';
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
      const [r1, r2] = await Promise.all([
        fetch(`${API.reports}${qs}`, { headers }),
        fetch(`${API.reports}/summary${qs}`, { headers }),
      ]);

      if (!r1.ok || !r2.ok) {
        const err = await (!r1.ok ? r1 : r2).json().catch(() => null);
        notify.error(err?.message ?? 'No se pudieron cargar los reportes.');
        return;
      }

      const [rowsData, summaryData] = await Promise.all([r1.json(), r2.json()]);
      setReports(Array.isArray(rowsData) ? rowsData : []);
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
    loadReports('', '');
  };

  const chartData = [...reports].slice(0, 10).reverse();
  const hasSalesActivity = reports.some((r) => Number(r.totalSold) > 0 || Number(r.totalOrders) > 0);

  const stats = summary
    ? [
        { label: 'Total vendido', value: `$${Number(summary.total_sold).toLocaleString('es-CO')}`, icon: '💰', color: 'stat-purple' },
        { label: 'Total pagado', value: `$${Number(summary.total_paid).toLocaleString('es-CO')}`, icon: '💳', color: 'stat-blue' },
        { label: 'Reembolsos', value: `$${Number(summary.total_refunded).toLocaleString('es-CO')}`, icon: '↩️', color: 'stat-green' },
        { label: 'Descuentos activos', value: String(summary.active_promotional_codes), icon: '🏷️', color: 'stat-orange' },
        { label: 'Pedidos hoy', value: String(summary.orders_today), icon: '🛒', color: 'stat-blue' },
        { label: 'Clientes nuevos hoy', value: String(summary.new_customers_today), icon: '👤', color: 'stat-purple' },
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
      </div>

      {loading ? (
        <p style={{ color: 'var(--text)', padding: '20px 0' }}>Calculando reportes dinámicos...</p>
      ) : (
        <>
          {summary && (
            <div className="stats-grid reportes-stats">
              {stats.map((s) => (
                <div key={s.label} className={`stat-card ${s.color}`}>
                  <span className="stat-icon">{s.icon}</span>
                  <div>
                    <p className="stat-value">{s.value}</p>
                    <p className="stat-label">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!hasSalesActivity && (fromDate || toDate) && (
            <div className="reportes-vacio-aviso" role="status">
              No se registraron ventas en el período de tiempo seleccionado.
            </div>
          )}

          <div className="reportes-graficas">
            <div className="chart-section">
              <h2 className="section-heading">Ventas vs Pagos</h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#aa3bff" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#aa3bff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gPagos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => String(v).slice(5, 10)} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => (v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`)}
                  />
                  <Tooltip formatter={(v) => [`$${Number(v).toLocaleString('es-CO')}`, '']} />
                  <Legend />
                  <Area type="monotone" dataKey="totalSold" name="Vendido" stroke="#aa3bff" strokeWidth={2} fill="url(#gVentas)" />
                  <Area type="monotone" dataKey="totalPaid" name="Pagado" stroke="#10b981" strokeWidth={2} fill="url(#gPagos)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-section">
              <h2 className="section-heading">Pedidos por día</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => String(v).slice(5, 10)} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalOrders" name="Total" fill="#aa3bff" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="deliveredOrders" name="Entregados" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="canceledOrders" name="Cancelados" fill="#e74c3c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-section">
              <h2 className="section-heading">Reembolsos</h2>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => String(v).slice(5, 10)} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => (v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`)}
                  />
                  <Tooltip formatter={(v) => [`$${Number(v).toLocaleString('es-CO')}`, 'Reembolsos']} />
                  <Bar dataKey="totalRefunded" name="Reembolsado" fill="#e74c3c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="reportes-tabla-section">
            <h2 className="section-heading">Detalle diario</h2>
            {reports.length === 0 ? (
              <p style={{ color: 'var(--text)', margin: 0 }}>No hay registros diarios para mostrar.</p>
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
                    {reports.map((r) => (
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
        </>
      )}
    </div>
  );
}