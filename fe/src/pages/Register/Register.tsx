import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import PasswordInput from "../../components/ui/PasswordInput";
import { validarPassword } from "../../utils/validarPassword";
import "../ResetPassword/Auth.css";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    const passwordCheck = validarPassword(password);
    if (!passwordCheck.valid) {
      setError(
        passwordCheck.message || "La contraseña no cumple los requisitos.",
      );
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    const result = await register(name.trim(), email, password);
    if (!result.ok) {
      setError(result.message || "No se pudo crear la cuenta.");
      return;
    }
    setSuccess("¡Cuenta creada! Redirigiendo...");
    setTimeout(() => navigate("/cliente"), 1500);
  };

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="register-title">
        <div className="auth-mark">✦</div>
        <h1 id="register-title" className="auth-title">
          Empieza a <em>crear.</em>
        </h1>
        <p className="auth-subtitle">
          Crea tu cuenta y encuentra todo lo que necesitas en un mismo lugar.
        </p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="register-name">
              Nombre completo
            </label>
            <input
              id="register-name"
              className="auth-input"
              type="text"
              placeholder="Tu nombre"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="register-email">
              Correo electrónico
            </label>
            <input
              id="register-email"
              className="auth-input"
              type="email"
              placeholder="tucorreo@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="register-password">
              Contraseña
            </label>
            <PasswordInput
              id="register-password"
              className="auth-input"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="register-confirm">
              Confirmar contraseña
            </label>
            <PasswordInput
              id="register-confirm"
              className="auth-input"
              placeholder="Repite la contraseña"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </div>
          {error && <p className="auth-alert">⚠️ {error}</p>}
          {success && <p className="auth-alert success">✓ {success}</p>}
          <button type="submit" className="auth-submit">
            Crear cuenta →
          </button>
        </form>
        <div className="auth-links">
          <span>
            ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
          </span>
        </div>
      </section>
    </main>
  );
};
export default Register;