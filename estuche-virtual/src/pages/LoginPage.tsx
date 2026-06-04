// pages/Login.tsx
import LoginComponent from '../components/Login';

export default function Login() {
  const manejarIngreso = (correo: string, pass: string) => {
    alert(`Login:\nCorreo: ${correo}\nContraseña: ${pass}`);
  };

  return <LoginComponent onLoginExitoso={manejarIngreso} />;
}