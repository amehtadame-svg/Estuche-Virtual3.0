import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { users } from '../db/users';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = users.find((u) => u.email === email);
  if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: 'Credenciales inválidas' });

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: '8h' }
  );

  return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
};

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const existe = users.find((u) => u.email === email);
  if (existe) return res.status(400).json({ message: 'El correo ya está registrado' });

  const hashed = await bcrypt.hash(password, 10);
  const newUser = {
    id: users.length + 1,
    name,
    email,
    password: hashed,
    role: 'cliente' as const,
  };

  users.push(newUser);

  const token = jwt.sign(
    { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
    process.env.JWT_SECRET as string,
    { expiresIn: '8h' }
  );

  return res.status(201).json({ token, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } });
};