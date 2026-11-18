import {
  createContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { API } from '../api/api';

export type Role =
  | 'client'
  | 'employee'
  | 'delivery'
  | 'admin'
  | 'superadmin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface AuthResult {
  ok: boolean;
  message?: string;
  locked?: boolean;
  intentosRestantes?: number;
  previewUrl?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (
    name: string,
    email: string,
    password: string,
  ) => Promise<AuthResult>;
  logout: () => void;
  updateUserName: (name: string) => void;
  generateResetToken: (email: string) => Promise<AuthResult>;
  verifyResetToken: (email: string, token: string) => Promise<AuthResult>;
  resetPassword: (
    email: string,
    token: string,
    newPassword: string,
  ) => Promise<AuthResult>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

async function postJson(
  url: string,
  body: unknown,
): Promise<AuthResult & { data?: any }> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    let data: any = null;

    try {
      data = await response.json();
    } catch {
      // La respuesta puede venir sin JSON.
    }

    if (!response.ok) {
      return {
        ok: false,
        message: data?.message ?? `Error ${response.status}. Inténtalo de nuevo.`,
        locked: data?.locked ?? response.status === 423,
        intentosRestantes: data?.remainingAttempts,
        data,
      };
    }

    return {
      ok: true,
      message: data?.message,
      previewUrl: data?.previewUrl,
      data,
    };
  } catch {
    return {
      ok: false,
      message:
        'No se pudo conectar con el servidor. Verifica que el backend esté encendido.',
    };
  }
}

export const AuthProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
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

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${API.auth}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) {
          clearSession();
          return;
        }

        const me = await response.json();
        const freshUser: User = {
          id: me.id,
          email: me.email,
          name: me.name,
          role: me.role,
        };

        setUser(freshUser);
        localStorage.setItem('user', JSON.stringify(freshUser));
      })
      .catch(() => clearSession())
      .finally(() => setLoading(false));
  }, [clearSession]);

  const login = async (
    email: string,
    password: string,
  ): Promise<AuthResult> => {
    const result = await postJson(`${API.auth}/login`, { email, password });

    if (!result.ok) return result;

    const { user: loggedInUser, token } = result.data;
    setUser(loggedInUser);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    localStorage.setItem('token', token);

    return { ok: true };
  };

  const register = async (
    name: string,
    email: string,
    password: string,
  ): Promise<AuthResult> => {
    const result = await postJson(`${API.auth}/register`, {
      name,
      email,
      password,
    });

    if (!result.ok) return result;

    const { user: registeredUser, token } = result.data;
    setUser(registeredUser);
    localStorage.setItem('user', JSON.stringify(registeredUser));
    localStorage.setItem('token', token);

    return { ok: true };
  };

  const logout = () => clearSession();

  const updateUserName = (name: string) => {
    setUser((currentUser) => {
      if (!currentUser) return currentUser;

      const updatedUser = { ...currentUser, name };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const generateResetToken = (email: string) =>
    postJson(`${API.auth}/forgot-password`, { email });

  const verifyResetToken = (email: string, token: string) =>
    postJson(`${API.auth}/verify-reset-token`, { email, token });

  const resetPassword = (
    email: string,
    token: string,
    newPassword: string,
  ) =>
    postJson(`${API.auth}/reset-password`, {
      email,
      token,
      newPassword,
    });

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUserName,
        generateResetToken,
        verifyResetToken,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};