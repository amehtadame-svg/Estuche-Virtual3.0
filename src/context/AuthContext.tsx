import { createContext, useState, useContext, type ReactNode } from 'react';

const API = 'https://curly-winner-4j4rwwgw4wxp37pqp-4000.app.github.dev/api/auth';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'cliente' | 'administrador';
}

interface ResetToken {
  token: string;
  email: string;
  createdAt: number;
  used: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  generateResetToken: (email: string) => string | null;
  validateResetToken: (token: string) => { valid: boolean; email: string | null; reason?: string };
  resetPassword: (token: string, newPassword: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const stored = localStorage.getItem('user');
  const [user, setUser] = useState<User | null>(stored ? JSON.parse(stored) : null);

  // Login real
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      return true;
    } catch {
      return false;
    }
  };

  // Register real
  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      return true;
    } catch {
      return false;
    }
  };

  // Logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // Reset password (se mantiene local por ahora)
  const generateResetToken = (email: string): string | null => {
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem('reset_token', JSON.stringify({
      token, email, createdAt: Date.now(), used: false,
    } as ResetToken));
    return token;
  };

  const validateResetToken = (token: string) => {
    const raw = localStorage.getItem('reset_token');
    if (!raw) return { valid: false, email: null, reason: 'No hay ningún token activo.' };
    const data: ResetToken = JSON.parse(raw);
    if (data.token !== token) return { valid: false, email: null, reason: 'Token incorrecto.' };
    if (data.used)            return { valid: false, email: null, reason: 'Este token ya fue utilizado.' };
    if (Date.now() - data.createdAt > 600000) return { valid: false, email: null, reason: 'El token expiró.' };
    return { valid: true, email: data.email };
  };

  const resetPassword = (token: string, _newPassword: string): boolean => {
    const { valid, email } = validateResetToken(token);
    if (!valid || !email) return false;
    const raw = localStorage.getItem('reset_token');
    if (raw) {
      const data: ResetToken = JSON.parse(raw);
      localStorage.setItem('reset_token', JSON.stringify({ ...data, used: true }));
    }
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, generateResetToken, validateResetToken, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};