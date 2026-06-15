import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header/Header';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const stats = [
    { label: 'Productos', value: '124', icon: '📦', color: 'stat-purple' },
    { label: 'Pedidos hoy', value: '38', icon: '🛒', color: 'stat-blue' },
    { label: 'Facturas', value: '217', icon: '🧾', color: 'stat-green' },
    { label: 'Proveedores', value: '12', icon: '🏭', color: 'stat-orange' },
  ];

  const modules = [
    {
      title: 'Productos',
      description: 'Gestiona el inventario, precios y categorías de productos.',
      icon: '📦',
      route: '/admin/productos',
      accent: '#aa3bff',
    },
    {
      title: 'Pedidos',
      description: 'Revisa y actualiza el estado de los pedidos de clientes.',
      icon: '🛒',
      route: '/admin/pedidos',
      accent: '#3b82f6',
    },
    {
      title: 'Facturas',
      description: 'Consulta y descarga facturas emitidas a clientes.',
      icon: '🧾',
      route: '/admin/facturas',
      accent: '#10b981',
    },
    {
      title: 'Envíos',
      description: 'Monitorea el estado y rutas de los envíos activos.',
      icon: '🚚',
      route: '/admin/envios',
      accent: '#f59e0b',
    },
    {
      title: 'Proveedores',
      description: 'Administra los datos de contacto y catálogos de proveedores.',
      icon: '🏭',
      route: '/admin/proveedores',
      accent: '#ec4899',
    },
    {
      title: 'DetalleFacturas',
      description: 'Gestiona los detalles de las facturas.',
      icon: '🧾',
      route: '/admin/DetalleFacturas',
      accent: '#10b981',
    },
  ];

  const recentActivity = [
    { text: 'Nuevo pedido #4521 de Laura Pérez', time: 'Hace 5 min', icon: '🛒' },
    { text: 'Producto "Cuaderno A4" actualizado', time: 'Hace 20 min', icon: '📦' },
    { text: 'Factura #0217 generada', time: 'Hace 1 hora', icon: '🧾' },
    { text: 'Envío #312 marcado como entregado', time: 'Hace 2 horas', icon: '🚚' },
    { text: 'Proveedor "Papelería Luna" agregado', time: 'Ayer', icon: '🏭' },
  ];

  return (
    <>
      <Header />

      <div className="admin-container">

        {/* Top bar */}
        <div className="admin-topbar">
          <div>
            <h1 className="admin-title">Panel de administración</h1>
            <p className="admin-subtitle">Bienvenido de nuevo, <strong>{user?.name}</strong></p>
          </div>
        </div>

        {/* Stats row */}
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

          {/* Module cards */}
          <div className="modules-section">
            <h2 className="section-heading">Módulos</h2>
            <div className="modules-grid">
              {modules.map((m) => (
                <button
                  key={m.title}
                  className="module-card"
                  onClick={() => navigate(m.route)}
                  style={{ '--module-accent': m.accent } as React.CSSProperties}
                >
                  <div className="module-icon-wrap">
                    <span className="module-icon">{m.icon}</span>
                  </div>
                  <div className="module-info">
                    <h3 className="module-title">{m.title}</h3>
                    <p className="module-desc">{m.description}</p>
                  </div>
                  <span className="module-arrow">→</span>
                </button>
              ))}
            </div>
          </div>

          {/* Activity feed */}
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