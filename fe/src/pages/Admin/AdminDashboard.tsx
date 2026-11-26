import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  ClipboardList,
  PackagePlus,
  Receipt,
  ShoppingCart,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import { API, authHeaders } from '../../api/api';
import { orderStatusLabel } from '../../lib/statusLabels';
import './AdminDashboard.css';

interface ProductLite {
  id: string;
  name: string;
  sku?: string | null;
  stock: number;
  stockMin: number;
}

interface OrderLite {
  id: string;
  total: number | string | null;
  status: string | null;
  orderDate: string | null;
  customer: { fullName: string } | null;
}

const statusTone: Record<string, string> = {
  pending: 'tone-info',
  paid: 'tone-accent',
  preparing: 'tone-warning',
  shipped: 'tone-warning',
  delivered: 'tone-success',
  canceled: 'tone-danger',
  returned: 'tone-neutral',
};

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const money = (value: number) =>
  `$${Math.round(value).toLocaleString('es-CO')}`;

async function getList<T>(url: string): Promise<T[] | null> {
  try {
    const response = await fetch(url, { headers: authHeaders() });
    if (!response.ok) return null;
    const data = await response.json();
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

const quickLinks: { label: string; to: string; icon: LucideIcon }[] = [
  { label: 'Registrar ingreso de mercancía', to: '/admin/ingresos', icon: PackagePlus },
  { label: 'Gestionar pedidos', to: '/admin/pedidos', icon: ClipboardList },
  { label: 'Recibos', to: '/admin/recibos', icon: Receipt },
  { label: 'Envíos', to: '/admin/envios', icon: Truck },
];

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductLite[] | null>(null);
  const [orders, setOrders] = useState<OrderLite[] | null>(null);
  const [receipts, setReceipts] = useState<unknown[] | null>(null);
  const [providers, setProviders] = useState<unknown[] | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      getList<ProductLite>(API.products),
      getList<OrderLite>(API.orders),
      getList<unknown>(API.receipts),
      getList<unknown>(API.providers),
    ]).then(([p, o, r, pr]) => {
      if (!alive) return;
      setProducts(p);
      setOrders(o);
      setReceipts(r);
      setProviders(pr);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const today = new Date().toDateString();
  const ordersToday =
    orders?.filter((o) => o.orderDate && new Date(o.orderDate).toDateString() === today).length ?? 0;

  const lowStock = useMemo(
    () =>
      (products ?? [])
        .filter((p) => p.stock <= p.stockMin)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 6),
    [products],
  );

  const recentOrders = useMemo(
    () =>
      [...(orders ?? [])]
        .sort((a, b) => new Date(b.orderDate ?? 0).getTime() - new Date(a.orderDate ?? 0).getTime())
        .slice(0, 5),
    [orders],
  );

  // Ventas reales de los últimos 6 meses (excluye pedidos cancelados).
  const monthlySales = useMemo(() => {
    const now = new Date();
    const buckets = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return { key: `${d.getFullYear()}-${d.getMonth()}`, month: MONTHS[d.getMonth()], sales: 0 };
    });
    (orders ?? []).forEach((o) => {
      if (!o.orderDate || o.status === 'canceled') return;
      const d = new Date(o.orderDate);
      const bucket = buckets.find((b) => b.key === `${d.getFullYear()}-${d.getMonth()}`);
      if (bucket) bucket.sales += Number(o.total ?? 0);
    });
    return buckets;
  }, [orders]);

  const hasSales = monthlySales.some((m) => m.sales > 0);

  const stats: { label: string; value: string; icon: LucideIcon; color: string; to: string }[] = [
    { label: 'Productos activos', value: products ? String(products.length) : '—', icon: Boxes, color: 'stat-purple', to: '/admin/productos' },
    { label: 'Pedidos hoy', value: orders ? String(ordersToday) : '—', icon: ShoppingCart, color: 'stat-blue', to: '/admin/pedidos' },
    { label: 'Recibos', value: receipts ? String(receipts.length) : '—', icon: Receipt, color: 'stat-green', to: '/admin/recibos' },
    { label: 'Proveedores', value: providers ? String(providers.length) : '—', icon: Truck, color: 'stat-orange', to: '/admin/proveedores' },
  ];

  return (
    <div className="admin-container">
      <div className="admin-topbar">
        <div>
          <h1 className="admin-title">Panel de administración</h1>
          <p className="admin-subtitle">
            Hola, <strong>{user?.name}</strong>. Este es el estado de la tienda hoy.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className={`stat-card ${s.color}`}>
            <span className="stat-icon" aria-hidden="true">
              <s.icon size={20} />
            </span>
            <div>
              <p className="stat-value">{loading ? '…' : s.value}</p>
              <p className="stat-label">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="admin-body">
        <div className="admin-left">
          <div className="chart-section">
            <h2 className="section-heading">Ventas últimos 6 meses</h2>
            {hasSales ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlySales}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#b026ea" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#b026ea" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--muted)' }} stroke="var(--border)" />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'var(--muted)' }}
                    stroke="var(--border)"
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(v) => [money(Number(v)), 'Ventas']}
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-h)' }}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#b026ea" strokeWidth={2} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="admin-empty">
                {loading ? 'Cargando ventas…' : 'Aún no hay ventas registradas en los últimos 6 meses.'}
              </p>
            )}
          </div>

          <div className="ultimos-pedidos-section">
            <div className="section-heading-row">
              <h2 className="section-heading">Últimos pedidos</h2>
              <Link to="/admin/pedidos" className="section-link">
                Ver todos <ArrowRight size={14} />
              </Link>
            </div>
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
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="table-empty">
                      {loading ? 'Cargando pedidos…' : 'Todavía no hay pedidos registrados.'}
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((p) => (
                    <tr key={p.id}>
                      <td className="num-pedido" title={p.id}>#{p.id.slice(-6).toUpperCase()}</td>
                      <td>{p.customer?.fullName ?? '—'}</td>
                      <td>{p.orderDate ? new Date(p.orderDate).toLocaleDateString('es-CO') : '—'}</td>
                      <td>{money(Number(p.total ?? 0))}</td>
                      <td>
                        <span className={`estado-badge ${statusTone[p.status ?? ''] ?? 'tone-neutral'}`}>
                          {orderStatusLabel[p.status ?? ''] ?? p.status ?? '—'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-right">
          <div className="activity-section">
            <h2 className="section-heading">Existencias bajas</h2>
            {lowStock.length === 0 ? (
              <p className="admin-empty">
                {loading ? 'Revisando inventario…' : 'Todo el inventario está por encima del mínimo.'}
              </p>
            ) : (
              <div className="activity-list">
                {lowStock.map((p) => (
                  <div key={p.id} className="activity-item">
                    <span className="activity-icon tone-warning" aria-hidden="true">
                      <AlertTriangle size={16} />
                    </span>
                    <div className="activity-info">
                      <p className="activity-text">{p.name}</p>
                      <p className="activity-time">
                        {p.stock} uds. · mínimo {p.stockMin}
                        {p.sku ? ` · ${p.sku}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="activity-section">
            <h2 className="section-heading">Accesos rápidos</h2>
            <div className="quick-links">
              {quickLinks.map((q) => (
                <Link key={q.to} to={q.to} className="quick-link">
                  <span className="quick-link-icon" aria-hidden="true">
                    <q.icon size={17} />
                  </span>
                  <span>{q.label}</span>
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
