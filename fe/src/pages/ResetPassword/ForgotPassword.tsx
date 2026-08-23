import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="forgot-title">
        <div className="auth-mark">?</div>
        <h1 id="forgot-title" className="auth-title">
          Recupera tu <em>acceso.</em>
        </h1>
        <p className="auth-subtitle">
          Escribe tu correo y te enviaremos un código de seis dígitos para
          continuar.
        </p>
        {message ? (
          <div className="auth-alert success">
            ✓ {message}
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
            <div className="auth-field">
              <label className="auth-label" htmlFor="forgot-email">
                Correo electrónico
              </label>
              <input
                id="forgot-email"
                className="auth-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tucorreo@ejemplo.com"
                required
              />
            </div>
            {error && <p className="auth-alert">⚠️ {error}</p>}
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Enviando..." : "Enviar código →"}
            </button>
          </form>
        )}
        <div className="auth-links">
          <Link to="/login">← Volver al inicio de sesión</Link>
        </div>
      </section>
    </main>
  );
}