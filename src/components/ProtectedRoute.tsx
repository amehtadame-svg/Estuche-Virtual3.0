import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: Array<'cliente' | 'administrador'>;
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