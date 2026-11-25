import {
  Navigate,
  Outlet,
} from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { Role } from '../../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

const ProtectedRoute = ({
  allowedRoles,
}: ProtectedRouteProps) => {
  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <p role="status">
        Verificando sesión…
      </p>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(user.role)
  ) {
    return (
      <Navigate
        to="/no-acceso"
        replace
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;