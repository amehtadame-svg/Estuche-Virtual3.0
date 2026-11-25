import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { API, authHeaders } from '../../api/api';
import { orderStatusLabel } from '../../lib/statusLabels';
import { notify } from '../../lib/notifications';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './AdminDashboard.css';

interface DashboardStats {
  totalProducts: number;
  ordersToday: number;
  totalReceipts: number;
  totalProviders: number;
  salesToday: number;
  lowStockProducts: number;
}

interface MonthlySalePoint {
  month: string;
  sales: number;
  orders?: number;
}

interface RecentOrderRow {
  id: string;
  number: string;
  customer: string;
  date: string;
  total: number;
  status: string;
}

interface ActivityItem {
  id: string;
  icon: string;
  text: string;
  date: string;
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const statusColor: Record<string, string> = {
  pending: '#3b82f6',
  paid: '#0891b2',
  preparing: '#8b5cf6',
  shipped: '#f59e0b',
  in_transit: '#f59e0b',
  delivered: '#10b981',
  canceled: '#e74c3c',
  returned: '#6b7280',
};

const toDateKey = (value: string | Date | null | undefined): string => {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatRelativeTime = (isoDate: string): string => {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return 'Reciente';
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Hace unos segundos';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return toDateKey(d);
};

const buildEmptyMonths = (): MonthlySalePoint[] => {
  const now = new Date();
  const list: MonthlySalePoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    list.push({ month: MONTH_NAMES[d.getMonth()], sales: 0, orders: 0 });
  }
  return list;
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [statsData, setStatsData] = useState<DashboardStats>({
    totalProducts: 0,
    ordersToday: 0,
    totalReceipts: 0,
    totalProviders: 0,
    salesToday: 0,
    lowStockProducts: 0,
  });
  const [monthlySales, setMonthlySales] = useState<MonthlySalePoint[]>(buildEmptyMonths);
  const [recentOrders, setRecentOrders] = useState<RecentOrderRow[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const dashRes = await fetch(`${API.reports}/admin-dashboard`, { headers: authHeaders() });
        const data = await dashRes.json().catch(() => null);
        if (!dashRes.ok || !data) {
          notify.error(data?.message ?? 'No se pudo cargar el resumen administrativo.');
          return;
        }
        setStatsData(data.stats);
        setMonthlySales(Array.isArray(data.monthlySales) ? data.monthlySales : buildEmptyMonths());
        setRecentOrders(Array.isArray(data.recentOrders) ? data.recentOrders : []);
        setRecentActivity(Array.isArray(data.recentActivity) ? data.recentActivity : []);
      } catch {
        notify.error('Error de conexión al cargar el resumen administrativo.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const stats = [
    { label: 'Productos activos', value: String(statsData.totalProducts), icon: '📦', color: 'stat-purple' },
    { label: 'Pedidos hoy', value: String(statsData.ordersToday), icon: '🛒', color: 'stat-blue' },
    { label: 'Recibos emitidos', value: String(statsData.totalReceipts), icon: '🧾', color: 'stat-green' },
    { label: 'Proveedores', value: String(statsData.totalProviders), icon: '🏭', color: 'stat-orange' },
  ];

  return (
    <div className="admin-container">
      <div className="admin-topbar">
        <div>
          <h1 className="admin-title">Panel de administración</h1>
          <p className="admin-subtitle">
            Bienvenido de nuevo, <strong>{user?.name}</strong>
          </p>
          <p className="subtitulo-usuarios">
            Ventas de hoy: <strong>${statsData.salesToday.toLocaleString('es-CO')} COP</strong>
            {statsData.lowStockProducts > 0 && (
              <>
                {' '}· Productos con bajo stock: <strong>{statsData.lowStockProducts}</strong>
              </>
            )}
          </p>
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text)', padding: '20px 0' }}>Cargando resumen en tiempo real...</p>
      ) : (
        <>
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
              <div className="chart-section">
                <h2 className="section-heading">Ventas últimos 6 meses</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={monthlySales}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#aa3bff" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#aa3bff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v) => (v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`)}
                    />
                    <Tooltip formatter={(v) => [`$${Number(v).toLocaleString('es-CO')}`, 'Ventas']} />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#aa3bff"
                      strokeWidth={2}
                      fill="url(#colorSales)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="ultimos-pedidos-section">
                <h2 className="section-heading">Últimos pedidos</h2>
                {recentOrders.length === 0 ? (
                  <p className="admin-empty-msg">Aún no se han registrado pedidos en la plataforma.</p>
                ) : (
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
                      {recentOrders.map((p) => (
                        <tr key={p.id}>
                          <td className="num-pedido">{p.number}</td>
                          <td>{p.customer}</td>
                          <td>{p.date}</td>
                          <td>${Number(p.total).toLocaleString('es-CO')}</td>
                          <td>
                            <span
                              className="estado-badge"
                              style={{ backgroundColor: statusColor[p.status] ?? '#6b7280' }}
                            >
                              {orderStatusLabel[p.status] ?? p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="activity-section">
              <h2 className="section-heading">Actividad reciente</h2>
              {recentActivity.length === 0 ? (
                <p className="admin-empty-msg">Sin movimientos recientes registrados.</p>
              ) : (
                <div className="activity-list">
                  {recentActivity.map((a) => (
                    <div key={a.id} className="activity-item">
                      <span className="activity-icon">{a.icon}</span>
                      <div className="activity-info">
                        <p className="activity-text">{a.text}</p>
                        <p className="activity-time">{formatRelativeTime(a.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;