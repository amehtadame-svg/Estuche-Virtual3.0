import { useEffect, useState } from 'react';
import { API, authHeaders } from '../../../api/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
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
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const headers = authHeaders();

  useEffect(() => {
    const load = async () => {
      const [r1, r2] = await Promise.all([
        fetch(API.reports, { headers }),
        fetch(`${API.reports}/summary`, { headers }),
      ]);
      if (r1.ok) setReports(await r1.json());
      if (r2.ok) setSummary(await r2.json());
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const last6 = [...reports].slice(0, 6).reverse();

  const stats = summary
    ? [
        { label: 'Total vendido', value: `$${Number(summary.total_sold).toLocaleString()}`, icon: '💰', color: 'stat-purple' },
        { label: 'Total pagado', value: `$${Number(summary.total_paid).toLocaleString()}`, icon: '💳', color: 'stat-blue' },
        { label: 'Reembolsos', value: `$${Number(summary.total_refunded).toLocaleString()}`, icon: '↩️', color: 'stat-green' },
        { label: 'Descuentos activos', value: String(summary.active_promotional_codes), icon: '🏷️', color: 'stat-orange' },
        { label: 'Pedidos hoy', value: String(summary.orders_today), icon: '🛒', color: 'stat-blue' },
        { label: 'Clientes nuevos hoy', value: String(summary.new_customers_today), icon: '👤', color: 'stat-purple' },
      ]
    : [];

  return (
    <div className="reportes-page">
      <div className="reportes-topbar">
        <h2 className="titulo-reportes">Reportes Financieros</h2>
      </div>

      {/* Stats en tiempo real */}
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

      <div className="reportes-graficas">
        {/* Ventas vs Pagos */}
        <div className="chart-section">
          <h2 className="section-heading">Ventas vs Pagos</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={last6}>
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
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, '']} />
              <Legend />
              <Area type="monotone" dataKey="totalSold" name="Vendido" stroke="#aa3bff" strokeWidth={2} fill="url(#gVentas)" />
              <Area type="monotone" dataKey="totalPaid" name="Pagado" stroke="#10b981" strokeWidth={2} fill="url(#gPagos)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pedidos */}
        <div className="chart-section">
          <h2 className="section-heading">Pedidos por día</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={last6}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalOrders" name="Total" fill="#aa3bff" radius={[4, 4, 0, 0]} />
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
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Reembolsos']} />
              <Bar dataKey="totalRefunded" name="Reembolsado" fill="#e74c3c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla detallada */}
      <div className="reportes-tabla-section">
        <h2 className="section-heading">Detalle diario</h2>
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
                  <td className="vendido-reporte">${Number(r.totalSold).toLocaleString()}</td>
                  <td>${Number(r.totalPaid).toLocaleString()}</td>
                  <td className="reembolsado-reporte">${Number(r.totalRefunded).toLocaleString()}</td>
                  <td>{r.productsSold}</td>
                  <td>{r.newCustomers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
