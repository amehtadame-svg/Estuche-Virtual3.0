import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function CartAccess({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p role="status">Verificando sesión…</p>;
  if (user?.role === 'employee' || user?.role === 'delivery') return <Navigate to="/no-acceso" replace />;
  return children;
}
