import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, KeyRound, Mail } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import "./Auth.css";

export default function ForgotPassword() {
  const { generateResetToken } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    const result = await generateResetToken(email.trim().toLowerCase());
    setLoading(false);
    if (!result.ok) {
      setError(
        result.message || "No se pudo enviar el código. Inténtalo de nuevo.",
      );
      return;
    }
    setMessage(
      result.message ||
        "Si el correo está registrado, recibirás el código en breve.",
    );
    if (result.previewUrl) setPreview(result.previewUrl);
    setTimeout(
      () =>
        navigate("/reset-password", {
          state: { email: email.trim().toLowerCase() },
        }),
      2500,
    );
  };

  return (
    <main className="auth-center">
      <div className="auth-brand-row">
        <span className="auth-word">
          Estuche <em>Virtual</em>
        </span>
      </div>
      <section className="auth-card" aria-labelledby="forgot-title">
        <div className="auth-key">
          <KeyRound size={22} />
        </div>
        <h1 id="forgot-title">¿Olvidaste tu contraseña?</h1>
        <p className="auth-lead">
          Tranquilo, nos pasa a todos. Te enviaremos un enlace para crear una
          nueva.
        </p>
        {message ? (
          <div className="auth-alert success">
            {message}
            {preview && (
              <p>
                <a href={preview} target="_blank" rel="noreferrer">
                  Abrir correo de prueba
                </a>
              </p>
            )}
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-input-icon">
              <Mail size={16} />
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@correo.com"
                required
              />
            </div>
            {error && <p className="auth-alert">{error}</p>}
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Enviando..." : "Enviar enlace"}
            </button>
          </form>
        )}
        <Link className="auth-back" to="/login">
          <ArrowLeft size={14} /> Volver a iniciar sesión
        </Link>
      </section>
    </main>
  );
}
