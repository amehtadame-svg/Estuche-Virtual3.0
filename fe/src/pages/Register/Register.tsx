import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Gift, Lock, Mail, Phone, Sparkles, User } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import PasswordInput from "../../components/ui/PasswordInput";
import { validarPassword } from "../../utils/validarPassword";
import "../ResetPassword/Auth.css";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [terms, setTerms] = useState(false);
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
    if (!terms) {
      setError("Debes aceptar los términos de servicio.");
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
    <main className="auth-split">
      <aside className="auth-visual register-visual">
        <img
          src="https://images.pexels.com/photos/159751/book-address-book-learning-learn-159751.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1200&w=900"
          alt=""
        />
        <div className="auth-visual-copy register-copy">
          <h2>
            Crea tu cuenta y empieza a <em>ahorrar</em>
          </h2>
          <ul>
            <li>
              <Gift size={16} /> Cupón de bienvenida del 10% en tu primera compra
            </li>
            <li>
              <Sparkles size={16} /> Acceso anticipado a ofertas y lanzamientos
            </li>
            <li>
              <Bell size={16} /> Alertas de reposición de tus productos favoritos
            </li>
          </ul>
          <p className="auth-footnote">Más de 15.000 cuentas creadas desde 2019</p>
        </div>
      </aside>

      <section className="auth-panel" aria-labelledby="register-title">
        <h1 id="register-title">
          Crea tu <em>cuenta</em>
        </h1>
        <p className="auth-lead">Gratis, en menos de un minuto. Sin tarjeta.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="register-name">Nombre completo</label>
            <div className="auth-input-icon">
              <User size={16} />
              <input
                id="register-name"
                type="text"
                placeholder="María Pérez"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
          </div>
          <div className="auth-field">
            <label htmlFor="register-email">Correo electrónico</label>
            <div className="auth-input-icon">
              <Mail size={16} />
              <input
                id="register-email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </div>
          <div className="auth-field">
            <label htmlFor="register-phone">Teléfono (opcional)</label>
            <div className="auth-input-icon">
              <Phone size={16} />
              <input
                id="register-phone"
                type="tel"
                placeholder="300 123 4567"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>
          </div>
          <div className="auth-two">
            <div className="auth-field">
              <label htmlFor="register-password">Contraseña</label>
              <div className="auth-input-icon">
                <Lock size={16} />
                <PasswordInput
                  id="register-password"
                  placeholder="Mínimo 8"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
            </div>
            <div className="auth-field">
              <label htmlFor="register-confirm">Confirmar</label>
              <PasswordInput
                id="register-confirm"
                className="auth-plain"
                placeholder="Repetir"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </div>
          </div>
          <label className="auth-check">
            <input
              type="checkbox"
              checked={terms}
              onChange={(event) => setTerms(event.target.checked)}
            />
            Acepto los términos de servicio y la política de privacidad.
          </label>
          {error && <p className="auth-alert">{error}</p>}
          {success && <p className="auth-alert success">{success}</p>}
          <button type="submit" className="auth-submit">
            Crear cuenta  →
          </button>
        </form>
        <p className="auth-switch">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </section>
    </main>
  );
};

export default Register;
