import { useState } from 'react';
import './DetalleFacturas.css';

const detallesIniciales = [
  { id: 1, factura: 'FAC-001', producto: 'Cuaderno universitario', cantidad: 2, precioUnitario: 8500 },
  { id: 2, factura: 'FAC-001', producto: 'Lapicero azul x10', cantidad: 1, precioUnitario: 5000 },
  { id: 3, factura: 'FAC-002', producto: 'Set de colores x12', cantidad: 1, precioUnitario: 12000 },
  { id: 4, factura: 'FAC-003', producto: 'Mochila escolar', cantidad: 1, precioUnitario: 45000 },
  { id: 5, factura: 'FAC-003', producto: 'Tijeras punta redonda', cantidad: 2, precioUnitario: 6500 },
  { id: 6, factura: 'FAC-004', producto: 'Carpeta argollada', cantidad: 3, precioUnitario: 9500 },
];

export default function DetalleFacturas() {
  const [detalles, setDetalles] = useState(detallesIniciales);
  const [formulario, setFormulario] = useState({
    factura: '',
    producto: '',
    cantidad: '',
    precioUnitario: ''
  });

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState('');

  const mostrarMensaje = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(''), 2500);
  };

  const handleCambio = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value
    });
  };

  const handleGuardar = () => {
    if (
      !formulario.factura ||
      !formulario.producto ||
      !formulario.cantidad ||
      !formulario.precioUnitario
    ) {
      mostrarMensaje('Por favor completa todos los campos.');
      return;
    }

    if (editandoId !== null) {
      setDetalles(
        detalles.map((d) =>
          d.id === editandoId
            ? {
                ...d,
                factura: formulario.factura,
                producto: formulario.producto,
                cantidad: Number(formulario.cantidad),
                precioUnitario: Number(formulario.precioUnitario)
              }
            : d
        )
      );

      mostrarMensaje('Detalle actualizado.');
      setEditandoId(null);
    } else {
      setDetalles([
        ...detalles,
        {
          id: Date.now(),
          factura: formulario.factura,
          producto: formulario.producto,
          cantidad: Number(formulario.cantidad),
          precioUnitario: Number(formulario.precioUnitario)
        }
      ]);

      mostrarMensaje('Detalle agregado.');
    }

    setFormulario({
      factura: '',
      producto: '',
      cantidad: '',
      precioUnitario: ''
    });
  };

  const handleEditar = (d: typeof detallesIniciales[0]) => {
    setFormulario({
      factura: d.factura,
      producto: d.producto,
      cantidad: String(d.cantidad),
      precioUnitario: String(d.precioUnitario)
    });

    setEditandoId(d.id);
  };

  const handleEliminar = (id: number) => {
    setDetalles(detalles.filter((d) => d.id !== id));
    mostrarMensaje('Detalle eliminado.');
  };

  return (
    <div>
      <h2 className="titulo-detalle">
        Detalle de Facturas
      </h2>

      {mensaje && (
        <div className="mensaje-detalle">
          {mensaje}
        </div>
      )}

      <div className="contenedor-detalle">

        <div className="formulario-detalle">

          <h2 className="subtitulo-detalle">
            {editandoId !== null
              ? 'Editar detalle'
              : 'Agregar detalle'}
          </h2>

          <p className="label-detalle">N° Factura</p>
          <input
            name="factura"
            value={formulario.factura}
            onChange={handleCambio}
            placeholder="Ej: FAC-001"
            className="input-detalle"
          />

          <p className="label-detalle">Producto</p>
          <input
            name="producto"
            value={formulario.producto}
            onChange={handleCambio}
            placeholder="Nombre del producto"
            className="input-detalle"
          />

          <p className="label-detalle">Cantidad</p>
          <input
            name="cantidad"
            type="number"
            value={formulario.cantidad}
            onChange={handleCambio}
            placeholder="Cantidad"
            className="input-detalle"
          />

          <p className="label-detalle">Precio unitario</p>
          <input
            name="precioUnitario"
            type="number"
            value={formulario.precioUnitario}
            onChange={handleCambio}
            placeholder="Precio en pesos"
            className="input-detalle"
          />

          <button
            onClick={handleGuardar}
            className="btn-guardar-detalle"
          >
            {editandoId !== null
              ? 'Guardar cambios'
              : 'Agregar detalle'}
          </button>

          {editandoId !== null && (
            <button
              onClick={() => {
                setEditandoId(null);
                setFormulario({
                  factura: '',
                  producto: '',
                  cantidad: '',
                  precioUnitario: ''
                });
              }}
              className="btn-cancelar-detalle"
            >
              Cancelar
            </button>
          )}

        </div>

        <table className="tabla-detalle">
          <thead>
            <tr>
              <th>N° Factura</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio unitario</th>
              <th>Subtotal</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {detalles.map((d) => (
              <tr key={d.id}>
                <td className="factura-detalle">
                  {d.factura}
                </td>

                <td className="producto-detalle">
                  {d.producto}
                </td>

                <td>{d.cantidad}</td>

                <td>
                  ${d.precioUnitario.toLocaleString()}
                </td>

                <td className="subtotal-detalle">
                  ${(d.cantidad * d.precioUnitario).toLocaleString()}
                </td>

                <td>
                  <button
                    onClick={() => handleEditar(d)}
                    className="btn-editar-detalle"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => handleEliminar(d.id)}
                    className="btn-eliminar-detalle"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>
    </div>
  );
}