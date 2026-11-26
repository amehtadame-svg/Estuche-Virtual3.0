import { useAuth } from './useAuth';

// Visitantes y clientes conservan el carrito; el personal operativo no compra desde esta vista.
export function useCanShop() {
  const { user, loading } = useAuth();
  return !loading && user?.role !== 'employee' && user?.role !== 'delivery';
}
