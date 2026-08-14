import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { API, authHeaders } from '../../api/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import './SuperAdminDashboard.css';

interface Summary {
  total_sold: number;
  total_paid: number;
  total_refunded: number;
  active_promotional_codes: number;
  orders_today: number;
  new_customers_today: number;
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
  const headers = authHeaders();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [r1, r2, r3] = await Promise.all([
          fetch(`${API.reports}/summary`, { headers }),
          fetch(API.reports, { headers }),
          fetch(API.users, { headers }),
        ]);

        if (r1.ok) setSummary(await r1.json());
        if (r2.ok) setReports(await r2.json());
        if (r3.ok) {
          const users = await r3.json();
          // Contar usuarios por rol
          const count: Record<string, number> = {};
          users.forEach((u: any) => {
            count[u.role] = (count[u.role] || 0) + 1;
          });
          setRolesCount(Object.entries(count).map(([role, total]) => ({ role, total })));
        }
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const last6 = [...reports].slice(0, 6).reverse();

  const stats = summary
    ? [
        { label: 'Total vendido', value: `$${Number(summary.total_sold).toLocaleString()}`, icon: '💰', color: 'stat-purple' },
        { label: 'Total pagado', value: `$${Number(summary.total_paid).toLocaleString()}`, icon: '💳', color: 'stat-blue' },
        { label: 'Reembolsos', value: `$${Number(summary.total_refunded).toLocaleString()}`, icon: '↩️', color: 'stat-red' },
        { label: 'Descuentos activos', value: String(summary.active_promotional_codes), icon: '🏷️', color: 'stat-orange' },
        { label: 'Pedidos hoy', value: String(summary.orders_today), icon: '🛒', color: 'stat-green' },
        { label: 'Clientes nuevos hoy', value: String(summary.new_customers_today), icon: '👤', color: 'stat-blue' },
      ]
    : [];

  const roleColor: Record<string, string> = {
    superadmin: '#7c3aed',
    admin: '#2563eb',
    employee: '#0891b2',
    delivery: '#d97706',
    client: '#6b7280',
  };

  return (
    <div className="sa-dashboard">
      {/* Topbar */}
      <div className="sa-topbar">
        <div>
          <h1 className="sa-title">Panel SuperAdmin</h1>
          <p className="sa-subtitle">
            Bienvenido, <strong>{user?.name}</strong> — control total del sistema
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
          {/* Stats */}
          {summary && (
            <div className="sa-stats-grid">
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

          <div className="sa-body">
            {/* Columna izquierda — gráficas */}
            <div className="sa-left">
              {/* Ventas vs Pagos */}
              <div className="sa-chart-section">
                <h2 className="sa-section-heading">Ventas vs Pagos</h2>
                {last6.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={last6}>
                      <defs>
                        <linearGradient id="saVentas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="saPagos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, '']} />
                      <Legend />
                      <Area type="monotone" dataKey="totalSold" name="Vendido" stroke="#7c3aed" strokeWidth={2} fill="url(#saVentas)" />
                      <Area type="monotone" dataKey="totalPaid" name="Pagado" stroke="#10b981" strokeWidth={2} fill="url(#saPagos)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="sa-no-data">Sin datos de reportes aún</p>
                )}
              </div>

              {/* Pedidos por día */}
              <div className="sa-chart-section">
                <h2 className="sa-section-heading">Pedidos por día</h2>
                {last6.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={last6}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="totalOrders" name="Total" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="deliveredOrders" name="Entregados" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="canceledOrders" name="Cancelados" fill="#e74c3c" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="sa-no-data">Sin datos de reportes aún</p>
                )}
              </div>
            </div>

            {/* Columna derecha */}
            <div className="sa-right">
              {/* Distribución de usuarios por rol */}
              <div className="sa-chart-section">
                <h2 className="sa-section-heading">Usuarios por rol</h2>
                <div className="sa-roles-list">
                  {rolesCount.map(({ role, total }) => (
                    <div key={role} className="sa-rol-item">
                      <div className="sa-rol-info">
                        <span className="sa-rol-dot" style={{ backgroundColor: roleColor[role] ?? '#6b7280' }} />
                        <span className="sa-rol-nombre">{role}</span>
                      </div>
                      <div className="sa-rol-bar-wrap">
                        <div
                          className="sa-rol-bar"
                          style={{
                            width: `${Math.min((total / Math.max(...rolesCount.map((r) => r.total))) * 100, 100)}%`,
                            backgroundColor: roleColor[role] ?? '#6b7280',
                          }}
                        />
                      </div>
                      <span className="sa-rol-total">{total}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Accesos rápidos */}
              <div className="sa-chart-section">
                <h2 className="sa-section-heading">Accesos rápidos</h2>
                <div className="sa-accesos">
                  {[
                    { label: 'Gestionar usuarios', icon: '👥', href: '/superadmin/usuarios' },
                    { label: 'Ver pagos', icon: '💳', href: '/superadmin/pagos' },
                    { label: 'Descuentos', icon: '🏷️', href: '/superadmin/descuentos' },
                    { label: 'Devoluciones', icon: '↩️', href: '/superadmin/devoluciones' },
                    { label: 'Reportes completos', icon: '📊', href: '/superadmin/reportes' },
                  ].map((a) => (
                    <a key={a.label} href={a.href} className="sa-acceso-item">
                      <span className="sa-acceso-icon">{a.icon}</span>
                      <span className="sa-acceso-label">{a.label}</span>
                      <span className="sa-acceso-arrow">→</span>
                    </a>
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
