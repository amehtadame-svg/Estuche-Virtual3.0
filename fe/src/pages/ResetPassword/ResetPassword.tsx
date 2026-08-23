import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import PasswordInput from "../../components/ui/PasswordInput";
import { validarPassword } from "../../utils/validarPassword";
import "./Auth.css";

export default function ResetPassword() {
  const { resetPassword, verifyResetToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { email?: string; message?: string } | null;
  const [email] = useState(state?.email ?? "");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<"token" | "password">("token");
  const [verifying, setVerifying] = useState(false);
  const verifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!token.trim()) {
      setError("Ingresa el código de verificación.");
      return;
    }
    setVerifying(true);
    const result = await verifyResetToken(email.trim(), token.toUpperCase());
    setVerifying(false);
    if (result.ok) setStep("password");
    else setError(result.message || "Código incorrecto.");
  };
  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    const check = validarPassword(password);
    if (!check.valid) {
      setError(check.message || "La contraseña no cumple los requisitos.");
      return;
    }
    const result = await resetPassword(
      email.trim(),
      token.toUpperCase(),
      password,
    );
    if (result.ok) {
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } else setError(result.message || "No se pudo cambiar la contraseña.");
  };
  if (success)
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <div className="auth-success-icon">✓</div>
          <h1 className="auth-title">
            ¡Todo <em>listo!</em>
          </h1>
          <p className="auth-subtitle">
            Tu contraseña se actualizó correctamente. Serás redirigido al inicio
            de sesión.
          </p>
        </section>
      </main>
    );
  const isToken = step === "token";
  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="reset-title">
        <div className="auth-mark">{isToken ? "✦" : "✓"}</div>
        <h1 id="reset-title" className="auth-title">
          {isToken ? (
            <>
              Verifica tu <em>código.</em>
            </>
          ) : (
            <>
              Nueva <em>contraseña.</em>
            </>
          )}
        </h1>
        <p className="auth-subtitle">
          {isToken
            ? "Ingresa el código enviado a tu correo para continuar."
            : "Crea una contraseña segura para proteger tu cuenta."}
        </p>
        {state?.message && isToken && (
          <p className="auth-alert">🔒 {state.message}</p>
        )}
        <form
          className="auth-form"
          onSubmit={isToken ? verifyCode : changePassword}
        >
          {isToken ? (
            <>
              <div className="auth-field">
                <label className="auth-label" htmlFor="reset-email">
                  Correo electrónico
                </label>
                <input
                  id="reset-email"
                  className="auth-input"
                  type="email"
                  value={email}
                  disabled
                />
              </div>
              <div className="auth-field">
                <label className="auth-label" htmlFor="reset-code">
                  Código de verificación
                </label>
                <input
                  id="reset-code"
                  className="auth-input"
                  type="text"
                  value={token}
                  onChange={(event) =>
                    setToken(event.target.value.toUpperCase())
                  }
                  placeholder="Ej: A3F9K2"
                  maxLength={6}
                  required
                />
              </div>
            </>
          ) : (
            <>
              <div className="auth-field">
                <label className="auth-label" htmlFor="reset-password">
                  Nueva contraseña
                </label>
                <PasswordInput
                  id="reset-password"
                  className="auth-input"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                />
                <p className="auth-helper">
                  Usa mayúscula, minúscula, número y carácter especial.
                </p>
              </div>
              <div className="auth-field">
                <label className="auth-label" htmlFor="reset-confirm">
                  Confirmar contraseña
                </label>
                <PasswordInput
                  id="reset-confirm"
                  className="auth-input"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  placeholder="Repite la contraseña"
                  required
                />
              </div>
            </>
          )}
          {error && <p className="auth-alert">⚠️ {error}</p>}
          <button type="submit" className="auth-submit" disabled={verifying}>
            {verifying
              ? "Verificando..."
              : isToken
                ? "Verificar código →"
                : "Cambiar contraseña →"}
          </button>
        </form>
        <div className="auth-links">
          <Link to={isToken ? "/forgot-password" : "/login"}>
            {isToken
              ? "← Solicitar un nuevo código"
              : "← Volver al inicio de sesión"}
          </Link>
        </div>
      </section>
    </main>
  );
}