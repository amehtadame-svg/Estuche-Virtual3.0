import { useState, useEffect } from 'react';
import Header from '../../components/Header/Header';
import { useAuth } from '../../context/AuthContext';
import { API } from '../../api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts';
import './SuperAdminDashboard.css';

interface Resumen {
  total_vendido:        number;
  total_pagado:         number;
  total_reembolsado:    number;
  descuentos_activos:   number;
  pedidos_hoy:          number;
  clientes_nuevos_hoy:  number;
}

interface Reporte {
  id_reporte:          number;
  fecha:               string;
  total_pedidos:       number;
  pedidos_entregados:  number;
  pedidos_cancelados:  number;
  total_vendido:       number;
  total_pagado:        number;
  total_reembolsado:   number;
  productos_vendidos:  number;
  clientes_nuevos:     number;
}

interface UsuarioRol {
  rol:   string;
  total: number;
}

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [resumen,  setResumen]  = useState<Resumen | null>(null);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [rolesCount, setRolesCount] = useState<UsuarioRol[]>([]);
  const [loading, setLoading] = useState(true);

  const token   = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        const [r1, r2, r3] = await Promise.all([
          fetch(`${API.reportes}/resumen`, { headers }),
          fetch(API.reportes,             { headers }),
          fetch(API.usuarios,             { headers }),
        ]);

        if (r1.ok) setResumen(await r1.json());
        if (r2.ok) setReportes(await r2.json());
        if (r3.ok) {
          const usuarios = await r3.json();
          // Contar usuarios por rol
          const conteo: Record<string, number> = {};
          usuarios.forEach((u: any) => {
            conteo[u.rol] = (conteo[u.rol] || 0) + 1;
          });
          setRolesCount(Object.entries(conteo).map(([rol, total]) => ({ rol, total })));
        }
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const ultimos6 = [...reportes].slice(0, 6).reverse();

  const stats = resumen ? [
    { label: 'Total vendido',       value: `$${Number(resumen.total_vendido).toLocaleString()}`,     icon: '💰', color: 'stat-purple' },
    { label: 'Total pagado',        value: `$${Number(resumen.total_pagado).toLocaleString()}`,       icon: '💳', color: 'stat-blue'   },
    { label: 'Reembolsos',          value: `$${Number(resumen.total_reembolsado).toLocaleString()}`,  icon: '↩️', color: 'stat-red'    },
    { label: 'Descuentos activos',  value: String(resumen.descuentos_activos),                        icon: '🏷️', color: 'stat-orange' },
    { label: 'Pedidos hoy',         value: String(resumen.pedidos_hoy),                               icon: '🛒', color: 'stat-green'  },
    { label: 'Clientes nuevos hoy', value: String(resumen.clientes_nuevos_hoy),                       icon: '👤', color: 'stat-blue'   },
  ] : [];

  const rolColor: Record<string, string> = {
    superadmin:    '#7c3aed',
    administrador: '#2563eb',
    empleado:      '#0891b2',
    repartidor:    '#d97706',
    cliente:       '#6b7280',
  };

  return (
    <>
      <Header />
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
            {resumen && (
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
                  {ultimos6.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={ultimos6}>
                        <defs>
                          <linearGradient id="saVentas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}    />
                          </linearGradient>
                          <linearGradient id="saPagos" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}    />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="fecha" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, '']} />
                        <Legend />
                        <Area type="monotone" dataKey="total_vendido" name="Vendido" stroke="#7c3aed" strokeWidth={2} fill="url(#saVentas)" />
                        <Area type="monotone" dataKey="total_pagado"  name="Pagado"  stroke="#10b981" strokeWidth={2} fill="url(#saPagos)"  />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="sa-no-data">Sin datos de reportes aún</p>
                  )}
                </div>

                {/* Pedidos por día */}
                <div className="sa-chart-section">
                  <h2 className="sa-section-heading">Pedidos por día</h2>
                  {ultimos6.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={ultimos6}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="fecha" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total_pedidos"      name="Total"      fill="#7c3aed" radius={[4,4,0,0]} />
                        <Bar dataKey="pedidos_entregados" name="Entregados" fill="#10b981" radius={[4,4,0,0]} />
                        <Bar dataKey="pedidos_cancelados" name="Cancelados" fill="#e74c3c" radius={[4,4,0,0]} />
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
                    {rolesCount.map(({ rol, total }) => (
                      <div key={rol} className="sa-rol-item">
                        <div className="sa-rol-info">
                          <span
                            className="sa-rol-dot"
                            style={{ backgroundColor: rolColor[rol] ?? '#6b7280' }}
                          />
                          <span className="sa-rol-nombre">{rol}</span>
                        </div>
                        <div className="sa-rol-bar-wrap">
                          <div
                            className="sa-rol-bar"
                            style={{
                              width: `${Math.min((total / Math.max(...rolesCount.map(r => r.total))) * 100, 100)}%`,
                              backgroundColor: rolColor[rol] ?? '#6b7280',
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
                      { label: 'Gestionar usuarios',  icon: '👥', href: '/superadmin/usuarios'    },
                      { label: 'Ver pagos',           icon: '💳', href: '/superadmin/pagos'       },
                      { label: 'Descuentos',          icon: '🏷️', href: '/superadmin/descuentos'  },
                      { label: 'Devoluciones',        icon: '↩️', href: '/superadmin/devoluciones'},
                      { label: 'Reportes completos',  icon: '📊', href: '/superadmin/reportes'    },
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
    </>
  );
}