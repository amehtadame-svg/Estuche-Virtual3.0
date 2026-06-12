import { createContext, useState, useContext, type ReactNode } from 'react';

// Tipos 

interface User {
  id: number;
  email: string;
  name: string;
  role: 'cliente' | 'administrador';
  password: string;
}

interface ResetToken {
  token: string;
  email: string;
  createdAt: number;
  used: boolean;
}

interface AuthContextType {
  user: Omit<User, 'password'> | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  generateResetToken: (email: string) => string | null;
  validateResetToken: (token: string) => {
    valid: boolean;
    email: string | null;
    reason?: string;
  };
  resetPassword: (token: string, newPassword: string) => boolean;
}

// Aqui van los usuarios 

const INITIAL_USERS: User[] = [
  {
    id: 1,
    email: 'cliente@test.com',
    name: 'Cliente Demo',
    role: 'cliente',
    password: '123',
  },
  {
    id: 2,
    email: 'admin@test.com',
    name: 'Admin Demo',
    role: 'administrador',
    password: '123',
  },
  {
    id: 3,
    email: 'francksalamanca54526@gmail.com',
    name: 'Admin',
    role: 'administrador',
    password: '5452629',
  },
];

// Contexto 

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [user, setUser]   = useState<Omit<User, 'password'> | null>(null);

  // Login 
  const login = (email: string, password: string): boolean => {
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) return false;

    const { password: _, ...safeUser } = found;
    setUser(safeUser);
    localStorage.setItem('user', JSON.stringify(safeUser));
    return true;
  };

  // Logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Generar token 
  const generateResetToken = (email: string): string | null => {
    const exists = users.find(u => u.email === email);
    if (!exists) return null;

    const token = Math.floor(100000 + Math.random() * 900000).toString();

    localStorage.setItem(
      'reset_token',
      JSON.stringify({
        token,
        email,
        createdAt: Date.now(),
        used: false,
      } as ResetToken)
    );

    return token;
  };

  // Validar token 
  const validateResetToken = (token: string) => {
    const raw = localStorage.getItem('reset_token');

    if (!raw)
      return { valid: false, email: null, reason: 'No hay ningún token activo.' };

    const data: ResetToken = JSON.parse(raw);
    const TEN_MIN = 1 * 60 * 1000;

    if (data.token !== token)
      return { valid: false, email: null, reason: 'Token incorrecto.' };

    if (data.used)
      return { valid: false, email: null, reason: 'Este token ya fue utilizado.' };

    if (Date.now() - data.createdAt > TEN_MIN)
      return { valid: false, email: null, reason: 'El token expiró (10 minutos).' };

    return { valid: true, email: data.email };
  };

  // Cambiar contraseña 
  const resetPassword = (token: string, newPassword: string): boolean => {
    const { valid, email } = validateResetToken(token);
    if (!valid || !email) return false;

    // Actualizar contraseña en el estado
    setUsers(prev =>
      prev.map(u => (u.email === email ? { ...u, password: newPassword } : u))
    );

    // Invalidar el token inmediatamente después de usarlo
    const raw = localStorage.getItem('reset_token');
    if (raw) {
      const data: ResetToken = JSON.parse(raw);
      localStorage.setItem(
        'reset_token',
        JSON.stringify({ ...data, used: true })
      );
    }

    return true;
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, generateResetToken, validateResetToken, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};