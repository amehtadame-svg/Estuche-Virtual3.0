import { useState } from 'react';
import './Facturas.css';

const facturasIniciales = [
  { id: 1, numero: 'FAC-001', cliente: 'Valentina Lopez', fecha: '2025-01-10', total: 85000, estado: 'Pagada' },
  { id: 2, numero: 'FAC-002', cliente: 'Isabella Garcia', fecha: '2025-01-12', total: 47000, estado: 'Pendiente' },
  { id: 3, numero: 'FAC-003', cliente: 'Camila Rodriguez', fecha: '2025-01-14', total: 120000, estado: 'Pagada' },
  { id: 4, numero: 'FAC-004', cliente: 'Lucia Torres', fecha: '2025-01-16', total: 35000, estado: 'Pendiente' },
  { id: 5, numero: 'FAC-005', cliente: 'Antonella Ramirez', fecha: '2025-01-18', total: 53000, estado: 'Anulada' },
];

const estadoColor: Record<string, string> = {
  Pagada: '#27ae60',
  Pendiente: '#f39c12',
  Anulada: '#e74c3c',
};

export default function Facturas() {
  const [facturas, setFacturas] = useState(facturasIniciales);
  const [mensaje, setMensaje] = useState('');

  const mostrarMensaje = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(''), 2500);
  };

  const cambiarEstado = (id: number, nuevoEstado: string) => {
    setFacturas(
      facturas.map((f) =>
        f.id === id ? { ...f, estado: nuevoEstado } : f
      )
    );
    mostrarMensaje('Estado actualizado.');
  };

  const handleEliminar = (id: number) => {
    setFacturas(facturas.filter((f) => f.id !== id));
    mostrarMensaje('Factura eliminada.');
  };

  return (
    <div>
      <h2 className="titulo-facturas">
        Gestion de Facturas
      </h2>

      {mensaje && (
        <div className="mensaje-facturas">
          {mensaje}
        </div>
      )}

      <table className="tabla-facturas">
        <thead>
          <tr>
            <th>N° Factura</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {facturas.map((fac) => (
            <tr key={fac.id}>
              <td className="numero-factura">{fac.numero}</td>
              <td className="cliente-factura">{fac.cliente}</td>
              <td>{fac.fecha}</td>
              <td className="total-factura">
                ${fac.total.toLocaleString()}
              </td>

              <td>
                <select
                  value={fac.estado}
                  onChange={(e) =>
                    cambiarEstado(fac.id, e.target.value)
                  }
                  className="estado-select-factura"
                  style={{
                    backgroundColor:
                      estadoColor[fac.estado] || '#999',
                  }}
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Pagada">Pagada</option>
                  <option value="Anulada">Anulada</option>
                </select>
              </td>

              <td>
                <button
                  onClick={() => handleEliminar(fac.id)}
                  className="btn-eliminar-factura"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}