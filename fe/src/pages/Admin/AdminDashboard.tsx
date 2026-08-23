import { useAuth } from '../../hooks/useAuth';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './AdminDashboard.css';

const monthlySales = [
  { month: 'Ago', sales: 320000 },
  { month: 'Sep', sales: 480000 },
  { month: 'Oct', sales: 390000 },
  { month: 'Nov', sales: 610000 },
  { month: 'Dic', sales: 750000 },
  { month: 'Ene', sales: 530000 },
];

const recentOrders = [
  { number: 'PED-005', customer: 'Antonella Ramirez', date: '2025-01-18', total: 53000, status: 'Cancelado' },
  { number: 'PED-004', customer: 'Lucia Torres', date: '2025-01-16', total: 35000, status: 'Procesando' },
  { number: 'PED-003', customer: 'Camila Rodriguez', date: '2025-01-14', total: 120000, status: 'Entregado' },
  { number: 'PED-002', customer: 'Isabella Garcia', date: '2025-01-12', total: 47000, status: 'En camino' },
  { number: 'PED-001', customer: 'Valentina Lopez', date: '2025-01-10', total: 85000, status: 'Entregado' },
];

const statusColor: Record<string, string> = {
  Entregado: '#10b981',
  'En camino': '#f59e0b',
  Procesando: '#3b82f6',
  Cancelado: '#e74c3c',
};

const recentActivity = [
  { text: 'Nuevo pedido #4521 de Laura Pérez', time: 'Hace 5 min', icon: '🛒' },
  { text: 'Producto "Cuaderno A4" actualizado', time: 'Hace 20 min', icon: '📦' },
  { text: 'Recibo #0217 generado', time: 'Hace 1 hora', icon: '🧾' },
  { text: 'Envío #312 marcado como entregado', time: 'Hace 2 horas', icon: '🚚' },
  { text: 'Proveedor "Papelería Luna" agregado', time: 'Ayer', icon: '🏭' },
];

const AdminDashboard = () => {
  const { user } = useAuth();

  const stats = [
    { label: 'Productos', value: '124', icon: '📦', color: 'stat-purple' },
    { label: 'Pedidos hoy', value: '38', icon: '🛒', color: 'stat-blue' },
    { label: 'Recibos', value: '217', icon: '🧾', color: 'stat-green' },
    { label: 'Proveedores', value: '12', icon: '🏭', color: 'stat-orange' },
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
                {recentOrders.map((p) => (
                  <tr key={p.number}>
                    <td className="num-pedido">{p.number}</td>
                    <td>{p.customer}</td>
                    <td>{p.date}</td>
                    <td>${p.total.toLocaleString()}</td>
                    <td>
                      <span className="estado-badge" style={{ backgroundColor: statusColor[p.status] }}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="activity-section">
          <h2 className="section-heading">Actividad reciente</h2>
          <div className="activity-list">
            {recentActivity.map((a, i) => (
              <div key={i} className="activity-item">
                <span className="activity-icon">{a.icon}</span>
                <div className="activity-info">
                  <p className="activity-text">{a.text}</p>
                  <p className="activity-time">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;