import { useAuth } from '../../context/AuthContext';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import './AdminDashboard.css';

const ventasMensuales = [
  { mes: 'Ago', ventas: 320000 },
  { mes: 'Sep', ventas: 480000 },
  { mes: 'Oct', ventas: 390000 },
  { mes: 'Nov', ventas: 610000 },
  { mes: 'Dic', ventas: 750000 },
  { mes: 'Ene', ventas: 530000 },
];

const ultimosPedidos = [
  { numero: 'PED-005', cliente: 'Antonella Ramirez', fecha: '2025-01-18', total: 53000, estado: 'Cancelado' },
  { numero: 'PED-004', cliente: 'Lucia Torres',      fecha: '2025-01-16', total: 35000, estado: 'Procesando' },
  { numero: 'PED-003', cliente: 'Camila Rodriguez',  fecha: '2025-01-14', total: 120000, estado: 'Entregado' },
  { numero: 'PED-002', cliente: 'Isabella Garcia',   fecha: '2025-01-12', total: 47000, estado: 'En camino' },
  { numero: 'PED-001', cliente: 'Valentina Lopez',   fecha: '2025-01-10', total: 85000, estado: 'Entregado' },
];

const estadoColor: Record<string, string> = {
  Entregado:  '#10b981',
  'En camino':'#f59e0b',
  Procesando: '#3b82f6',
  Cancelado:  '#e74c3c',
};

const recentActivity = [
  { text: 'Nuevo pedido #4521 de Laura Pérez',      time: 'Hace 5 min',   icon: '🛒' },
  { text: 'Producto "Cuaderno A4" actualizado',      time: 'Hace 20 min',  icon: '📦' },
  { text: 'Factura #0217 generada',                  time: 'Hace 1 hora',  icon: '🧾' },
  { text: 'Envío #312 marcado como entregado',       time: 'Hace 2 horas', icon: '🚚' },
  { text: 'Proveedor "Papelería Luna" agregado',     time: 'Ayer',         icon: '🏭' },
];

const AdminDashboard = () => {
  const { user } = useAuth();

  const stats = [
    { label: 'Productos',    value: '124', icon: '📦', color: 'stat-purple' },
    { label: 'Pedidos hoy', value: '38',  icon: '🛒', color: 'stat-blue'   },
    { label: 'Facturas',    value: '217', icon: '🧾', color: 'stat-green'  },
    { label: 'Proveedores', value: '12',  icon: '🏭', color: 'stat-orange' },
  ];

  return (
    <>
      <div className="admin-container">

        <div className="admin-topbar">
          <div>
            <h1 className="admin-title">Panel de administración</h1>
            <p className="admin-subtitle">Bienvenido de nuevo, <strong>{user?.name}</strong></p>
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

          {/* Columna izquierda */}
          <div className="admin-left">

            {/* Gráfica */}
            <div className="chart-section">
              <h2 className="section-heading">Ventas últimos 6 meses</h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={ventasMensuales}>
                  <defs>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#aa3bff" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#aa3bff" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Ventas']} />
                  <Area
                    type="monotone"
                    dataKey="ventas"
                    stroke="#aa3bff"
                    strokeWidth={2}
                    fill="url(#colorVentas)"
                  />
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
                  {ultimosPedidos.map((p) => (
                    <tr key={p.numero}>
                      <td className="num-pedido">{p.numero}</td>
                      <td>{p.cliente}</td>
                      <td>{p.fecha}</td>
                      <td>${p.total.toLocaleString()}</td>
                      <td>
                        <span
                          className="estado-badge"
                          style={{ backgroundColor: estadoColor[p.estado] }}
                        >
                          {p.estado}
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
    </>
  );
};

export default AdminDashboard;