import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import PasswordInput from "../../components/ui/PasswordInput";
import "../ResetPassword/Auth.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, generateResetToken } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);

    if (!result.ok) {
      if (result.locked) {
        await generateResetToken(email);
        setLoading(false);
        navigate("/reset-password", {
          state: { email, message: result.message },
        });
        return;
      }
      const remaining = result.intentosRestantes;
      setError(
        remaining !== undefined
          ? `Correo o contraseña incorrectos. Te quedan ${remaining} intento(s) antes del bloqueo.`
          : result.message || "Correo o contraseña incorrectos.",
      );
      setLoading(false);
      return;
    }

    const role = JSON.parse(localStorage.getItem("user") || "{}").role;
    setLoading(false);
    if (role === "client") navigate("/cliente");
    else if (role === "superadmin") navigate("/superadmin");
    else navigate("/admin");
  };

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="login-title">
        <div className="auth-mark">E</div>
        <h1 id="login-title" className="auth-title">
          Bienvenido <em>de nuevo.</em>
        </h1>
        <p className="auth-subtitle">
          Inicia sesión para continuar creando, aprendiendo y organizando tus
          ideas.
        </p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="login-email">
              Correo electrónico
            </label>
            <input
              id="login-email"
              className="auth-input"
              type="email"
              placeholder="tucorreo@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="login-password">
              Contraseña
            </label>
            <PasswordInput
              id="login-password"
              className="auth-input"
              placeholder="Tu contraseña"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error && <p className="auth-alert">⚠️ {error}</p>}
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Verificando..." : "Iniciar sesión →"}
          </button>
        </form>
        <div className="auth-links">
          <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
          <span>
            ¿Aún no tienes cuenta? <Link to="/register">Crea la tuya</Link>
          </span>
        </div>
      </section>
    </main>
  );
};
export default Login;