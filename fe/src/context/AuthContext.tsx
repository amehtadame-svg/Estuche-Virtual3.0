import { createContext, useState, useEffect, type ReactNode } from 'react';


import { API } from '../api/api';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'cliente' | 'administrador' | 'empleado' | 'repartidor' | 'superadmin';
}

// intentos quedan, para poder mostrar el mensaje correcto en pantalla.
interface LoginResult {
  ok: boolean;
  locked?: boolean;
  intentosRestantes?: number;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
  generateResetToken: (email: string) => Promise<string | null>;
  resetPassword: (email: string, token: string, newPassword: string) => Promise<{ ok: boolean; message?: string }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const stored = localStorage.getItem('user');
  const [user, setUser] = useState<User | null>(stored ? JSON.parse(stored) : null);
  useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token) return;

  fetch(`${API.auth}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(res => {
      if (!res.ok) {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    })
    .catch(() => {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    });
}, []);

const login = async (email: string, password: string): Promise<LoginResult> => {
  try {
    const res = await fetch(`${API.auth}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {

      // El backend responde locked:true cuando la cuenta se bloqueó

      return {
        ok: false,
        locked: !!data.locked,
        intentosRestantes: data.intentosRestantes,
        message: data.message,
      };
    }

    setUser(data.user);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.token);
    return { ok: true };
  } catch {
    return { ok: false, message: 'No se pudo conectar con el servidor.' };
  }
};

const register = async (name: string, email: string, password: string) => {
  try {
    const res = await fetch(`${API.auth}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, message: data.message };

    setUser(data.user);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.token);
    return { ok: true };
  } catch {
    return { ok: false, message: 'No se pudo conectar con el servidor.' };
  }
};

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

// Le pide al backend que genere un código de 6 dígitos y lo guarde

const generateResetToken = async (email: string): Promise<string | null> => {
  try {
    const res = await fetch(`${API.auth}/request-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.token ?? null;
  } catch {
    return null;
  }
};

// Envía email + código + nueva contraseña al backend, que valida todo

const resetPassword = async (email: string, token: string, newPassword: string) => {
  try {
    const res = await fetch(`${API.auth}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, message: data.message };
    return { ok: true };
  } catch {
    return { ok: false, message: 'No se pudo conectar con el servidor.' };
  }
};

  return (
    <AuthContext.Provider value={{ user, login, register, logout, generateResetToken, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};