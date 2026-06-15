import { useState } from 'react';
import './Proveedores.css';

const proveedoresIniciales = [
  { id: 1, nombre: 'Papeleria Nacional', contacto: 'Carlos Perez', correo: 'carlos@pnacional.com', telefono: '3001112222', productos: 'Cuadernos, Carpetas' },
  { id: 2, nombre: 'Colores y Arte', contacto: 'Maria Gomez', correo: 'maria@coloresarte.com', telefono: '3013334444', productos: 'Colores, Pinturas' },
  { id: 3, nombre: 'Utiles Express', contacto: 'Jorge Martinez', correo: 'jorge@utilesexpress.com', telefono: '3025556666', productos: 'Lapiceros, Borradores' },
  { id: 4, nombre: 'Mochilas y Mas', contacto: 'Ana Torres', correo: 'ana@mochilasmas.com', telefono: '3037778888', productos: 'Mochilas, Bolsos' },
];

export default function Proveedores() {
  const [proveedores, setProveedores] = useState(proveedoresIniciales);
  const [formulario, setFormulario] = useState({ nombre: '', contacto: '', correo: '', telefono: '', productos: '' });
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);

  const mostrarMensaje = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(''), 2500);
  };

  const handleCambio = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEditandoId(null);
    setFormulario({ nombre: '', contacto: '', correo: '', telefono: '', productos: '' });
  };

  const handleGuardar = () => {
    if (!formulario.nombre || !formulario.contacto || !formulario.correo || !formulario.telefono) {
      mostrarMensaje('Por favor completa todos los campos.');
      return;
    }

    if (editandoId !== null) {
      setProveedores(proveedores.map((p) => p.id === editandoId ? { ...p, ...formulario } : p));
      mostrarMensaje('Proveedor actualizado.');
    } else {
      setProveedores([...proveedores, { id: Date.now(), ...formulario }]);
      mostrarMensaje('Proveedor agregado.');
    }

    cerrarModal();
  };

  const handleEditar = (p: typeof proveedoresIniciales[0]) => {
    setFormulario({ nombre: p.nombre, contacto: p.contacto, correo: p.correo, telefono: p.telefono, productos: p.productos });
    setEditandoId(p.id);
    setModalAbierto(true);
  };

  const handleEliminar = (id: number) => {
    setProveedores(proveedores.filter((p) => p.id !== id));
    mostrarMensaje('Proveedor eliminado.');
  };

  return (
    <>
      <div className="proveedores-container">

        <div className="proveedores-topbar">
          <div>
            <h2 className="titulo-proveedores">Gestion de Proveedores</h2>
          </div>
          <button className="btn-nuevo-proveedor" onClick={() => setModalAbierto(true)}>
            + Nuevo proveedor
          </button>
        </div>

        {mensaje && <div className="mensaje-proveedores">{mensaje}</div>}

        <div className="table-wrapper">
          <table className="tabla-proveedores">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Contacto</th>
                <th>Correo</th>
                <th>Telefono</th>
                <th>Productos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {proveedores.map((p) => (
                <tr key={p.id}>
                  <td className="empresa-proveedor">{p.nombre}</td>
                  <td>{p.contacto}</td>
                  <td>{p.correo}</td>
                  <td>{p.telefono}</td>
                  <td>{p.productos}</td>
                  <td>
                    <button onClick={() => handleEditar(p)} className="btn-editar-proveedor">Editar</button>
                    <button onClick={() => handleEliminar(p.id)} className="btn-eliminar-proveedor">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {modalAbierto && (
          <div className="modal-overlay" onClick={cerrarModal}>
            <div className="modal-proveedores" onClick={(e) => e.stopPropagation()}>

              <div className="modal-header">
                <h3 className="modal-titulo">
                  {editandoId !== null ? 'Editar proveedor' : 'Nuevo proveedor'}
                </h3>
                <button className="modal-cerrar" onClick={cerrarModal}>✕</button>
              </div>

              <div className="modal-body">
                <p className="label-proveedor">Empresa</p>
                <input name="nombre" value={formulario.nombre} onChange={handleCambio} placeholder="Nombre de la empresa" className="input-proveedor" />

                <p className="label-proveedor">Contacto</p>
                <input name="contacto" value={formulario.contacto} onChange={handleCambio} placeholder="Nombre del contacto" className="input-proveedor" />

                <p className="label-proveedor">Correo</p>
                <input name="correo" value={formulario.correo} onChange={handleCambio} placeholder="correo@empresa.com" className="input-proveedor" />

                <p className="label-proveedor">Telefono</p>
                <input name="telefono" value={formulario.telefono} onChange={handleCambio} placeholder="Numero de telefono" className="input-proveedor" />

                <p className="label-proveedor">Productos que provee</p>
                <input name="productos" value={formulario.productos} onChange={handleCambio} placeholder="Ej: Cuadernos, Carpetas" className="input-proveedor" />
              </div>

              <div className="modal-footer">
                <button onClick={cerrarModal} className="btn-cancelar-proveedor">Cancelar</button>
                <button onClick={handleGuardar} className="btn-guardar-proveedor">
                  {editandoId !== null ? 'Guardar cambios' : 'Agregar proveedor'}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </>
  );
}