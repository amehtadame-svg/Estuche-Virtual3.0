import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { API } from '../api/api';

export type Role = 'client' | 'employee' | 'delivery' | 'admin' | 'superadmin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

/** Respuesta estándar de todas las operaciones de auth. */
export interface AuthResult {
  ok: boolean;
  message?: string;
  /** true si la cuenta quedó bloqueada por intentos fallidos. */
  locked?: boolean;
  /** Intentos que le quedan al usuario antes del bloqueo. */
  intentosRestantes?: number;
  /** Solo en desarrollo con Ethereal: enlace para ver el correo enviado. */
  previewUrl?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  /** Paso 1: pide al BACKEND que genere y envíe el código por correo. */
  generateResetToken: (email: string) => Promise<AuthResult>;
  /** Paso 2: valida el código contra el backend (no lo consume). */
  verifyResetToken: (email: string, token: string) => Promise<AuthResult>;
  /** Paso 3: cambia la contraseña usando el código. */
  resetPassword: (email: string, token: string, newPassword: string) => Promise<AuthResult>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Envoltura de fetch que siempre devuelve un AuthResult, nunca lanza. */
async function postJson(url: string, body: unknown): Promise<AuthResult & { data?: any }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch {
    }

    if (!res.ok) {
      return {
        ok: false,
        message: data?.message ?? `Error ${res.status}. Inténtalo de nuevo.`,
        locked: data?.locked ?? res.status === 423,
        intentosRestantes: data?.remainingAttempts,
        data,
      };
    }

    return { ok: true, message: data?.message, previewUrl: data?.previewUrl, data };
  } catch {
    // Error de red: el backend no responde.
    return {
      ok: false,
      message: 'No se pudo conectar con el servidor. Verifica que el backend esté encendido.',
    };
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    try {
      return stored ? (JSON.parse(stored) as User) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);

  // Revalida la sesión guardada contra el backend al cargar la app.
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${API.auth}/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) {
          clearSession();
          return;
        }
        const me = await res.json();
        // Mantiene el usuario local sincronizado con el token real.
        const fresh: User = { id: me.id, email: me.email, name: me.name, role: me.role };
        setUser(fresh);
        localStorage.setItem('user', JSON.stringify(fresh));
      })
      .catch(() => clearSession())
      .finally(() => setLoading(false));
  }, [clearSession]);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    const result = await postJson(`${API.auth}/login`, { email, password });
    if (!result.ok) return result;

    const { user: u, token } = result.data;
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('token', token);
    return { ok: true };
  };

  const register = async (name: string, email: string, password: string): Promise<AuthResult> => {
    const result = await postJson(`${API.auth}/register`, { name, email, password });
    if (!result.ok) return result;

    const { user: u, token } = result.data;
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('token', token);
    return { ok: true };
  };

  const logout = () => clearSession();

  const generateResetToken = (email: string) =>
    postJson(`${API.auth}/forgot-password`, { email });

  const verifyResetToken = (email: string, token: string) =>
    postJson(`${API.auth}/verify-reset-token`, { email, token });

  const resetPassword = (email: string, token: string, newPassword: string) =>
    postJson(`${API.auth}/reset-password`, { email, token, newPassword });

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        generateResetToken,
        verifyResetToken,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
