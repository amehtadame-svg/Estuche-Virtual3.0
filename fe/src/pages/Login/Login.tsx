import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, ShieldCheck, Truck } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import PasswordInput from "../../components/ui/PasswordInput";
import "../ResetPassword/Auth.css";

const LOGIN_IMG =
  "https://images.pexels.com/photos/636237/pexels-photo-636237.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1200&w=900";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
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

    if (remember) localStorage.setItem("remember-email", email);
    else localStorage.removeItem("remember-email");

    const role = JSON.parse(localStorage.getItem("user") || "{}").role;
    setLoading(false);
    if (role === "client") navigate("/cliente");
    else if (role === "superadmin") navigate("/superadmin");
    else navigate("/admin");
  };

  return (
    <main className="auth-split">
      <aside className="auth-visual login-visual">
        <img src={LOGIN_IMG} alt="" />
        <div className="auth-visual-copy">
          <p className="auth-quote">
            “La papelería más bonita en la puerta de tu casa, en menos de 24
            horas.”
          </p>
          <div className="auth-visual-meta">
            <span>
              <Truck size={14} /> Envío exprés 24 h
            </span>
            <span>
              <ShieldCheck size={14} /> Pago 100% seguro
            </span>
          </div>
        </div>
      </aside>

      <section className="auth-panel" aria-labelledby="login-title">
        <h1 id="login-title">
          Bienvenido de <em>nuevo</em>
        </h1>
        <p className="auth-lead">
          Accede para ver tus pedidos, puntos y ofertas exclusivas.
        </p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="login-email">Correo electrónico</label>
            <div className="auth-input-icon">
              <Mail size={16} />
              <input
                id="login-email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </div>
          <div className="auth-field">
            <label htmlFor="login-password">Contraseña</label>
            <div className="auth-input-icon">
              <Lock size={16} />
              <PasswordInput
                id="login-password"
                placeholder="••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
          </div>
          <div className="auth-row">
            <label className="auth-check">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              Recuérdame
            </label>
            <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
          </div>
          {error && <p className="auth-alert">{error}</p>}
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Verificando..." : "Iniciar sesión  →"}
          </button>
        </form>
        <p className="auth-switch">
          ¿Aún no tienes cuenta? <Link to="/register">Regístrate gratis</Link>
        </p>
      </section>
    </main>
  );
};

export default Login;
