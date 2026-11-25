import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, CreditCard, ShoppingCart, Tag, Undo2, UserPlus, Users, Wallet, type LucideIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { API, authHeaders } from '../../api/api';
import { notify } from '../../lib/notifications';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { roleLabel } from '../../lib/statusLabels';
import './SuperAdminDashboard.css';

const chartTooltip = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  color: 'var(--text-h)',
};

interface Summary {
  total_sold: number;
  total_paid: number;
  total_refunded: number;
  active_promotional_codes: number;
  orders_today: number;
  new_customers_today: number;
  total_orders?: number;
  delivered_orders?: number;
  products_sold?: number;
}

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

interface RoleCount {
  role: string;
  total: number;
}

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [rolesCount, setRolesCount] = useState<RoleCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const headers = authHeaders();
      try {
        const [r1, r2, r3] = await Promise.all([
          fetch(`${API.reports}/summary`, { headers }),
          fetch(API.reports, { headers }),
          fetch(API.users, { headers }),
        ]);

        if (r1.ok) setSummary(await r1.json());
        if (r2.ok) {
          const reportRows = await r2.json();
          if (Array.isArray(reportRows)) setReports(reportRows);
        }
        if (r3.ok) {
          const users = await r3.json();
          if (Array.isArray(users)) {
            const count: Record<string, number> = {};
            users.forEach((u: { role?: string }) => {
              const r = u.role ?? 'client';
              count[r] = (count[r] || 0) + 1;
            });
            setRolesCount(Object.entries(count).map(([role, total]) => ({ role, total })));
          }
        }
      } catch {
        notify.error('No se pudieron cargar los indicadores del sistema.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const last6 = [...reports].slice(0, 6).reverse();
  const maxRoleTotal = Math.max(1, ...rolesCount.map((r) => r.total));

  const stats: { label: string; value: string; icon: LucideIcon; color: string }[] = summary
    ? [
        { label: 'Total vendido', value: `$${Number(summary.total_sold).toLocaleString()}`, icon: Wallet, color: 'stat-purple' },
        { label: 'Total pagado', value: `$${Number(summary.total_paid).toLocaleString()}`, icon: CreditCard, color: 'stat-blue' },
        { label: 'Reembolsos', value: `$${Number(summary.total_refunded).toLocaleString()}`, icon: Undo2, color: 'stat-red' },
        { label: 'Descuentos activos', value: String(summary.active_promotional_codes), icon: Tag, color: 'stat-orange' },
        { label: 'Pedidos hoy', value: String(summary.orders_today), icon: ShoppingCart, color: 'stat-green' },
        { label: 'Clientes nuevos hoy', value: String(summary.new_customers_today), icon: UserPlus, color: 'stat-blue' },
      ]
    : [];

  const roleColor: Record<string, string> = {
    superadmin: '#b026ea',
    admin: '#2563eb',
    employee: '#0891b2',
    delivery: '#d97706',
    client: '#6b7280',
  };

  return (
    <div className="sa-dashboard">
      <div className="sa-topbar">
        <div>
          <h1 className="sa-title">Panel SuperAdmin</h1>
          <p className="sa-subtitle">
            Bienvenido, <strong>{user?.name}</strong> — indicadores consolidados en tiempo real
          </p>
        </div>
        <div className="sa-badge">
          <span className="sa-badge-dot" />
          Sistema activo
        </div>
      </div>

      {loading ? (
        <p className="sa-loading">Cargando datos del sistema...</p>
      ) : (
        <>
          {summary && (
            <div className="sa-stats-grid">
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

          <div className="sa-body">
            <div className="sa-left">
              <div className="sa-chart-section">
                <h2 className="sa-section-heading">Ventas vs Pagos (últimos 6 días)</h2>
                {last6.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={last6}>
                      <defs>
                        <linearGradient id="saVentas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#b026ea" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#b026ea" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="saPagos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted)' }} stroke="var(--border)" tickFormatter={(v) => v.slice(5)} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} stroke="var(--border)" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, '']} contentStyle={chartTooltip} />
                      <Legend wrapperStyle={{ fontSize: 12, color: 'var(--muted)' }} />
                      <Area type="monotone" dataKey="totalSold" name="Vendido" stroke="#b026ea" strokeWidth={2} fill="url(#saVentas)" />
                      <Area type="monotone" dataKey="totalPaid" name="Pagado" stroke="#10b981" strokeWidth={2} fill="url(#saPagos)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="sa-no-data">Sin datos de reportes aún</p>
                )}
              </div>

              <div className="sa-chart-section">
                <h2 className="sa-section-heading">Pedidos por día (últimos 6 días)</h2>
                {last6.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
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
                ) : (
                  <p className="sa-no-data">Sin datos de reportes aún</p>
                )}
              </div>
            </div>

            <div className="sa-right">
              <div className="sa-chart-section">
                <h2 className="sa-section-heading">Usuarios por rol</h2>
                {rolesCount.length === 0 ? (
                  <p className="sa-no-data">Sin usuarios registrados</p>
                ) : (
                  <div className="sa-roles-list">
                    {rolesCount.map(({ role, total }) => (
                      <div key={role} className="sa-rol-item">
                        <div className="sa-rol-info">
                          <span className="sa-rol-dot" style={{ backgroundColor: roleColor[role] ?? '#6b7280' }} />
                          <span className="sa-rol-nombre">{roleLabel[role] ?? role}</span>
                        </div>
                        <div className="sa-rol-bar-wrap">
                          <div
                            className="sa-rol-bar"
                            style={{
                              width: `${Math.min((total / maxRoleTotal) * 100, 100)}%`,
                              backgroundColor: roleColor[role] ?? '#6b7280',
                            }}
                          />
                        </div>
                        <span className="sa-rol-total">{total}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="sa-chart-section">
                <h2 className="sa-section-heading">Accesos rápidos</h2>
                <div className="sa-accesos">
                  {[
                    { label: 'Gestionar usuarios', icon: Users, href: '/superadmin/usuarios' },
                    { label: 'Ver pagos', icon: CreditCard, href: '/superadmin/pagos' },
                    { label: 'Descuentos', icon: Tag, href: '/superadmin/descuentos' },
                    { label: 'Devoluciones', icon: Undo2, href: '/superadmin/devoluciones' },
                    { label: 'Reportes completos', icon: BarChart3, href: '/superadmin/reportes' },
                  ].map((a) => (
                    <Link key={a.label} to={a.href} className="sa-acceso-item">
                      <span className="sa-acceso-icon" aria-hidden="true"><a.icon size={18} /></span>
                      <span className="sa-acceso-label">{a.label}</span>
                      <span className="sa-acceso-arrow" aria-hidden="true">→</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}