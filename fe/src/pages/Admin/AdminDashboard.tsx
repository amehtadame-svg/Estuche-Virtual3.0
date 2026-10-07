import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { API, authHeaders } from '../../api/api';
import { orderStatusLabel } from '../../lib/statusLabels';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './AdminDashboard.css';

// Colores por estado del pedido (valores del enum OrderStatus).
const statusColor: Record<string, string> = {
  pending: '#3b82f6',
  paid: '#2563eb',
  preparing: '#8b5cf6',
  shipped: '#f59e0b',
  delivered: '#10b981',
  canceled: '#e74c3c',
  returned: '#c0392b',
};


interface Summary {
  total_products: number;
  total_providers: number;
  total_receipts: number;
  total_orders: number;
  orders_today: number;
  pending_orders: number;
  low_stock_products: { id: string; name: string; stock: number; stockMin: number }[];
  monthly_sales: { month: string; sales: number }[];
}

interface RecentOrder {
  id: string;
  total: number | null;
  status: string | null;
  orderDate: string | null;
  customer: { fullName: string } | null;
}

const AdminDashboard = () => {
  const { user } = useAuth();

  // Cifras reales de la base de datos. Antes el panel mostraba números fijos
  // en el código ("124 productos"), que nunca cambiaban aunque la BD sí.
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recent, setRecent] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [resSummary, resOrders] = await Promise.all([
          fetch(`${API.reports}/summary`, { headers: authHeaders() }),
          fetch(API.orders, { headers: authHeaders() }),
        ]);

        if (resSummary.ok) setSummary(await resSummary.json());
        else setError('No se pudo cargar el resumen del negocio.');

        if (resOrders.ok) {
          const orders: RecentOrder[] = await resOrders.json();
          setRecent(orders.slice(0, 5));
        }
      } catch {
        setError('No se pudo conectar con el servidor.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = [
    { label: 'Productos', value: summary?.total_products ?? 0, icon: '📦', color: 'stat-purple' },
    { label: 'Pedidos hoy', value: summary?.orders_today ?? 0, icon: '🛒', color: 'stat-blue' },
    { label: 'Recibos', value: summary?.total_receipts ?? 0, icon: '🧾', color: 'stat-green' },
    { label: 'Proveedores', value: summary?.total_providers ?? 0, icon: '🏭', color: 'stat-orange' },
  ];

  return (
    <div className="admin-container">
      <div className="admin-topbar">
        <div>
          <h1 className="admin-title">Panel de administración</h1>
          <p className="admin-subtitle">
            Bienvenido de nuevo, <strong>{user?.name}</strong>
          </p>
          <p className="subtitulo-usuarios">Listo para administrar tu pagina?</p>
        </div>
      </div>

      {error && <div className="mensaje-pedidos mensaje-pedidos-error">{error}</div>}

      {/* Stats */}
      <div className="stats-grid">
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

      <div className="admin-body">
        <div className="admin-left">
          {/* Gráfica */}
          <div className="chart-section">
            <h2 className="section-heading">Ventas últimos 6 meses</h2>
            {(summary?.monthly_sales ?? []).length === 0 && !loading && (
              <p style={{ color: 'var(--text)', fontSize: 13 }}>Sin ventas registradas todavía.</p>
            )}
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={summary?.monthly_sales ?? []}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#aa3bff" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#aa3bff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Ventas']} />
                <Area type="monotone" dataKey="sales" stroke="#aa3bff" strokeWidth={2} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Últimos pedidos */}
          <div className="ultimos-pedidos-section">
            <h2 className="section-heading">Últimos pedidos</h2>
            <table className="tabla-resumen">
              <thead>
                <tr>
                  <th>N° Pedido</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((p) => (
                  <tr key={p.id}>
                    <td className="num-pedido">PED-{p.id.slice(0, 6).toUpperCase()}</td>
                    <td>{p.customer?.fullName ?? '—'}</td>
                    <td>{p.orderDate ? p.orderDate.split('T')[0] : '—'}</td>
                    <td>${Number(p.total ?? 0).toLocaleString()}</td>
                    <td>
                      <span
                        className="estado-badge"
                        style={{ backgroundColor: statusColor[p.status ?? ''] || '#999' }}
                      >
                        {orderStatusLabel[p.status ?? ''] ?? p.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {recent.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text)' }}>
                      Aún no hay pedidos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alertas de inventario (datos reales, HU-007) */}
        <div className="activity-section">
          <h2 className="section-heading">Productos por agotarse</h2>
          <div className="activity-list">
            {(summary?.low_stock_products ?? []).map((p) => (
              <div key={p.id} className="activity-item">
                <span className="activity-icon">⚠️</span>
                <div className="activity-info">
                  <p className="activity-text">{p.name}</p>
                  <p className="activity-time">
                    Stock {p.stock} / mínimo {p.stockMin}
                  </p>
                </div>
              </div>
            ))}
            {!loading && (summary?.low_stock_products ?? []).length === 0 && (
              <div className="activity-item">
                <span className="activity-icon">✅</span>
                <div className="activity-info">
                  <p className="activity-text">Todo el inventario está por encima del mínimo.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;