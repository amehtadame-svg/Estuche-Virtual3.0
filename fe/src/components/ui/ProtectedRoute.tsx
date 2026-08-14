import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { Role } from '../../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: Array<Role>;
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
