import bcrypt from 'bcryptjs';

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'cliente' | 'administrador';
}

export const users: User[] = [
  {
    id: 1,
    name: 'Admin',
    email: 'admin@estuche.com',
    password: bcrypt.hashSync('admin123', 10),
    role: 'administrador',
  },
  {
    id: 2,
    name: 'Cliente Demo',
    email: 'cliente@estuche.com',
    password: bcrypt.hashSync('cliente123', 10),
    role: 'cliente',
  },
];