import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ message: 'Token requerido' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || !user.isActive || user.deletedAt) {
      return res.status(401).json({ message: 'Cuenta no disponible' });
    }

    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

// Solo administrador o superadmin
export const verifyAdmin = (req: Request, res: Response, next: NextFunction) => {
  const role = (req as any).user?.role;
  if (role !== 'admin' && role !== 'superadmin')
    return res.status(403).json({ message: 'Acceso restringido a administradores' });
  next();
};

// Solo superadmin
export const verifySuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  const role = (req as any).user?.role;
  if (role !== 'superadmin')
    return res.status(403).json({ message: 'Acceso restringido a superadmin' });
  next();
};