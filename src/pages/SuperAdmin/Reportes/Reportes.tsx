import { useState, useEffect } from 'react';
import { API } from '../../../api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts';
import './Reportes.css';

interface Reporte {
  id_reporte:         number;
  fecha:              string;
  total_pedidos:      number;
  pedidos_entregados: number;
  pedidos_cancelados: number;
  total_vendido:      number;
  total_pagado:       number;
  total_reembolsado:  number;
  productos_vendidos: number;
  clientes_nuevos:    number;
}

interface Resumen {
  total_vendido:       number;
  total_pagado:        number;
  total_reembolsado:   number;
  descuentos_activos:  number;
  pedidos_hoy:         number;
  clientes_nuevos_hoy: number;
}

export default function Reportes() {
  const [reportes, setReportes]   = useState<Reporte[]>([]);
  const [resumen, setResumen]     = useState<Resumen | null>(null);
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const cargar = async () => {
      const [r1, r2] = await Promise.all([
        fetch(API.reportes,            { headers }),
        fetch(`${API.reportes}/resumen`, { headers }),
      ]);
      if (r1.ok) setReportes(await r1.json());
      if (r2.ok) setResumen(await r2.json());
    };
    cargar();
  }, []);

  const ultimos6 = [...reportes].slice(0, 6).reverse();

  const stats = resumen ? [
    { label: 'Total vendido',      value: `$${Number(resumen.total_vendido).toLocaleString()}`,      icon: '💰', color: 'stat-purple' },
    { label: 'Total pagado',       value: `$${Number(resumen.total_pagado).toLocaleString()}`,        icon: '💳', color: 'stat-blue'   },
    { label: 'Reembolsos',         value: `$${Number(resumen.total_reembolsado).toLocaleString()}`,   icon: '↩️', color: 'stat-green'  },
    { label: 'Descuentos activos', value: String(resumen.descuentos_activos),                         icon: '🏷️', color: 'stat-orange' },
    { label: 'Pedidos hoy',        value: String(resumen.pedidos_hoy),                                icon: '🛒', color: 'stat-blue'   },
    { label: 'Clientes nuevos hoy',value: String(resumen.clientes_nuevos_hoy),                        icon: '👤', color: 'stat-purple' },
  ] : [];

  return (
    <>
      <div className="reportes-page">

        <div className="reportes-topbar">
          <h2 className="titulo-reportes">Reportes Financieros</h2>
        </div>

        {/* Stats en tiempo real */}
        {resumen && (
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
              <AreaChart data={ultimos6}>
                <defs>
                  <linearGradient id="gVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#aa3bff" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#aa3bff" stopOpacity={0}    />
                  </linearGradient>
                  <linearGradient id="gPagos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, '']} />
                <Legend />
                <Area type="monotone" dataKey="total_vendido" name="Vendido" stroke="#aa3bff" strokeWidth={2} fill="url(#gVentas)" />
                <Area type="monotone" dataKey="total_pagado"  name="Pagado"  stroke="#10b981" strokeWidth={2} fill="url(#gPagos)"  />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Pedidos */}
          <div className="chart-section">
            <h2 className="section-heading">Pedidos por día</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ultimos6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_pedidos"      name="Total"      fill="#aa3bff" radius={[4,4,0,0]} />
                <Bar dataKey="pedidos_entregados" name="Entregados" fill="#10b981" radius={[4,4,0,0]} />
                <Bar dataKey="pedidos_cancelados" name="Cancelados" fill="#e74c3c" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Reembolsos */}
          <div className="chart-section">
            <h2 className="section-heading">Reembolsos</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={ultimos6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Reembolsos']} />
                <Bar dataKey="total_reembolsado" name="Reembolsado" fill="#e74c3c" radius={[4,4,0,0]} />
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
                {reportes.map((r) => (
                  <tr key={r.id_reporte}>
                    <td className="fecha-reporte">{r.fecha.slice(0, 10)}</td>
                    <td>{r.total_pedidos}</td>
                    <td className="entregados-reporte">{r.pedidos_entregados}</td>
                    <td className="cancelados-reporte">{r.pedidos_cancelados}</td>
                    <td className="vendido-reporte">${Number(r.total_vendido).toLocaleString()}</td>
                    <td>${Number(r.total_pagado).toLocaleString()}</td>
                    <td className="reembolsado-reporte">${Number(r.total_reembolsado).toLocaleString()}</td>
                    <td>{r.productos_vendidos}</td>
                    <td>{r.clientes_nuevos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}