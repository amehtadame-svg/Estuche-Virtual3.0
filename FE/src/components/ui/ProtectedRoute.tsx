import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  allowedRoles?: Array<'cliente' | 'administrador' | 'empleado' | 'repartidor' | 'superadmin'>;
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/no-acceso" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;