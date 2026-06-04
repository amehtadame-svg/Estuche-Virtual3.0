// pages/Registro.tsx
import RegistroComponent from '../components/Registro';

export default function Registro() {
  const manejarRegistro = (nombre: string, correo: string, pass: string) => {
    alert(`Registro:\nNombre: ${nombre}\nCorreo: ${correo}\nContraseña: ${pass}`);
  };

  return <RegistroComponent onRegistroExitoso={manejarRegistro} />;
}