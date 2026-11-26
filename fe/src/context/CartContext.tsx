import { createContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { API, authHeaders } from '../api/api';
import { notify } from '../lib/notifications';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  category: string;
  icon: string;
  imageUrl?: string | null;
  quantity: number;
}
interface CartContextType {
  items: CartItem[];
  add: (product: Omit<CartItem, 'quantity'>, quantity?: number) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  updateQuantity: (id: string, quantity: number) => Promise<boolean>;
  clear: () => Promise<boolean>;
  reload: () => Promise<boolean>;
  total: number;
  totalItems: number;
  loading: boolean;
  syncing: boolean;
  error: string;
}
export const CartContext = createContext<CartContextType | undefined>(undefined);
interface ServerItem {
  productId: string; quantity: number;
  product?: { name?: string; price?: number | string; category?: { name?: string }; images?: { url: string; isPrimary?: boolean }[] };
}
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const userId = user?.id;
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [pending, setPending] = useState(0);
  const [error, setError] = useState('');
  const scope = useRef(userId);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const lastNotice = useRef({ text: '', at: 0 });
  const enqueue = useCallback(<T,>(operation: () => Promise<T>) => {
    const result = queue.current.catch(() => undefined).then(operation);
    queue.current = result.catch(() => undefined);
    return result;
  }, []);

  const loadFromDb = useCallback(() => enqueue(async () => {
    if (scope.current !== userId) return false;
    if (!userId) { setItems([]); setError(''); setLoading(false); return true; }
    setLoading(true);
    setError('');
    try {
      const response = await fetch(API.shopping, { headers: authHeaders() });
      if (!response.ok) throw new Error();
      const data: ServerItem[] = await response.json();
      if (!Array.isArray(data)) throw new Error();
      if (scope.current !== userId) return false;
      setItems(data.map(item => ({ id: item.productId, quantity: item.quantity,
        name: item.product?.name ?? 'Producto no disponible', price: Number(item.product?.price ?? 0),
        category: item.product?.category?.name ?? '', icon: '📦',
        imageUrl: item.product?.images?.find(image => image.isPrimary)?.url ?? item.product?.images?.[0]?.url,
      })));
      return true;
    } catch {
      if (scope.current === userId) setError('No se pudo cargar tu carrito. Verifica tu conexión e intenta nuevamente.');
      return false;
    } finally { if (scope.current === userId) setLoading(false); }
  }), [userId, enqueue]);

  useEffect(() => {
    scope.current = userId;
    lastNotice.current = { text: '', at: 0 };
    setItems([]);
    setError('');
    void loadFromDb();
  }, [userId, loadFromDb]);

  function mutate(url: string, method: string, body: unknown, update: (previous: CartItem[]) => CartItem[]) {
    const headers = authHeaders();
    setPending(count => count + 1);
    return enqueue(async () => {
      if (scope.current !== userId) return false;
      try {
        if (userId) {
          const response = await fetch(url, { method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || (response.status === 401 ? 'Tu sesión venció. Inicia sesión nuevamente.' : 'No pudimos guardar el cambio del carrito. Intenta nuevamente.'));
          }
        }
        if (scope.current !== userId) return false;
        setItems(update);
        setError('');
        return true;
      } catch (reason) {
        if (scope.current !== userId) return false;
        const text = reason instanceof Error && !(reason instanceof TypeError) ? reason.message : 'No hay conexión con el servidor. Tu carrito no ha cambiado.';
        if (lastNotice.current.text !== text || Date.now() - lastNotice.current.at > 5000) {
          notify.error(text, 'No se pudo actualizar el carrito');
          lastNotice.current = { text, at: Date.now() };
        }
        return false;
      }
    }).finally(() => setPending(count => count - 1));
  }
  const add = (product: Omit<CartItem, 'quantity'>, quantity = 1) => {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) return Promise.resolve(false);
    return mutate(API.shopping, 'POST', { productId: product.id, quantity }, previous => previous.some(item => item.id === product.id)
      ? previous.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item)
      : [...previous, { ...product, quantity }]);
  };
  const remove = (id: string) => mutate(`${API.shopping}/${id}`, 'DELETE', undefined, previous => previous.filter(item => item.id !== id));
  const updateQuantity = (id: string, quantity: number) => quantity < 1 ? remove(id)
    : mutate(`${API.shopping}/${id}`, 'PUT', { quantity }, previous => previous.map(item => item.id === id ? { ...item, quantity } : item));
  const clear = () => mutate(`${API.shopping}/clear`, 'DELETE', undefined, () => []);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  return <CartContext.Provider value={{ items, add, remove, updateQuantity, clear, reload: loadFromDb, total, totalItems, loading, syncing: pending > 0, error }}>{children}</CartContext.Provider>;
};
