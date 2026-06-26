import { useState, useEffect } from 'react';
import Modal from '../../../components/Modal/Modal';
import './Proveedores.css';

import { API } from '../../../api';

const formularioVacio = { nombre: '', contacto: '', correo: '', telefono: '', productos: '' };

interface Proveedor {
  id_proveedor: number;
  nombre: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  contacto: string | null;
  productos_que_provee: string | null;
}

export default function Proveedores() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [formulario, setFormulario] = useState(formularioVacio);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cargando, setCargando] = useState(true);

  const cargarProveedores = () => {
    fetch(`${API.proveedores}`)
      .then(r => r.json())
      .then(data => { setProveedores(data); setCargando(false); })
      .catch(() => { mostrarMensaje('Error al cargar proveedores.'); setCargando(false); });
  };

  useEffect(() => { cargarProveedores(); }, []);

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
    setFormulario(formularioVacio);
  };

  const handleGuardar = async () => {
    if (!formulario.nombre || !formulario.contacto || !formulario.correo || !formulario.telefono) {
      mostrarMensaje('Por favor completa todos los campos.');
      return;
    }

    const body = {
      nombre: formulario.nombre,
      contacto: formulario.contacto,
      email: formulario.correo,
      telefono: formulario.telefono,
      productos_que_provee: formulario.productos,
    };

    if (editandoId !== null) {
      await fetch(`${API.proveedores}/${editandoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      mostrarMensaje('Proveedor actualizado.');
    } else {
      await fetch(`${API.proveedores}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      mostrarMensaje('Proveedor agregado.');
    }

    cargarProveedores();
    cerrarModal();
  };

  const handleEditar = (p: Proveedor) => {
    setFormulario({
      nombre: p.nombre,
      contacto: p.contacto ?? '',
      correo: p.email ?? '',
      telefono: p.telefono ?? '',
      productos: p.productos_que_provee ?? '',
    });
    setEditandoId(p.id_proveedor);
    setModalAbierto(true);
  };

  const handleEliminar = async (id: number) => {
    await fetch(`${API.proveedores}/${id}`, { method: 'DELETE' });
    setProveedores(proveedores.filter(p => p.id_proveedor !== id));
    mostrarMensaje('Proveedor eliminado.');
  };

  return (
    <>
      <div className="proveedores-page">

        <div className="proveedores-topbar">
          <div>
            <h2 className="titulo-proveedores">Gestion de Proveedores</h2>
            <p className="subtitulo-usuarios">Administra los Proveedores registrados</p>
          </div>
          <button className="btn-nuevo-proveedor" onClick={() => setModalAbierto(true)}>
            + Nuevo proveedor
          </button>
        </div>

        {mensaje && <div className="mensaje-proveedores">{mensaje}</div>}

        {cargando ? (
          <p style={{ color: 'var(--text)', padding: '20px 0' }}>Cargando proveedores...</p>
        ) : (
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
                  <tr key={p.id_proveedor}>
                    <td className="empresa-proveedor">{p.nombre}</td>
                    <td>{p.contacto ?? '—'}</td>
                    <td>{p.email ?? '—'}</td>
                    <td>{p.telefono ?? '—'}</td>
                    <td>{p.productos_que_provee ?? '—'}</td>
                    <td>
                      <button onClick={() => handleEditar(p)} className="btn-editar-proveedor"> Editar</button>
                      <button onClick={() => handleEliminar(p.id_proveedor)} className="btn-eliminar-proveedor"> Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {modalAbierto && (
          <Modal
            titulo={editandoId !== null ? 'Editar proveedor' : 'Nuevo proveedor'}
            onClose={cerrarModal}
            footer={
              <>
                <button onClick={cerrarModal} className="btn-cancelar-proveedor">Cancelar</button>
                <button onClick={handleGuardar} className="btn-guardar-proveedor">
                  {editandoId !== null ? 'Guardar cambios' : 'Agregar proveedor'}
                </button>
              </>
            }
          >
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
          </Modal>
        )}

      </div>
    </>
  );
}