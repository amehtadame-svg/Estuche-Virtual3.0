import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
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
  add: (product: Omit<CartItem, 'quantity'>) => void;
  remove: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  reload: () => Promise<boolean>;
  total: number;
  totalItems: number;
  loading: boolean;
  error: string;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

const iconsByCategory: Record<string, string> = {
  Cuadernos: '📓',
  Lapices: '✏️',
  Colores: '🎨',
  Arte: '🖌️',
  Oficina: '📁',
  Mochilas: '🎒',
  Tecnologia: '💻',
  Papeleria: '📄',
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState('');

  // Cargar carrito desde la BD cuando el usuario inicia sesión
  const loadFromDb = useCallback(async () => {
    if (!user) {
      setItems([]);
      setError('');
      return true;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API.shopping}`, { headers: authHeaders() });
      if (!res.ok) throw new Error('No se pudo cargar tu carrito. Intenta nuevamente.');
      const data = await res.json();
      setItems(
        data.map(
          (item: {
            productId: string;
            quantity: number;
            product?: {
              name?: string;
              price?: number | string;
              category?: { name?: string };
              images?: { url: string; isPrimary?: boolean }[];
            };
          }) => {
            const category = item.product?.category?.name ?? '';
            return {
              id: item.productId,
              name: item.product?.name ?? '',
              price: Number(item.product?.price ?? 0),
              category,
              imageUrl: item.product?.images?.find(image => image.isPrimary)?.url ?? item.product?.images?.[0]?.url,
              icon: iconsByCategory[category] ?? '📦',
              quantity: item.quantity,
            };
          },
        ),
      );
      return true;
    } catch {
      setError('No se pudo cargar tu carrito. Verifica tu conexión e intenta nuevamente.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadFromDb();
  }, [loadFromDb]);

  const persist = async (url: string, options: RequestInit) => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error();
    } catch {
      notify.error('No pudimos guardar el cambio. Estamos recuperando tu carrito.', 'Carrito sin actualizar');
      await loadFromDb();
    }
  };

  const add = async (product: Omit<CartItem, 'quantity'>) => {
    // Optimistic update — actualiza UI inmediatamente
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      return [...prev, { ...product, quantity: 1 }];
    });

    // Sincronizar con BD si hay usuario
    if (user) {
      await persist(`${API.shopping}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
    }
  };

  const remove = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (user) {
      await persist(`${API.shopping}/${id}`, { method: 'DELETE', headers: authHeaders() });
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity < 1) return remove(id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
    if (user) {
      await persist(`${API.shopping}/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ quantity }),
      });
    }
  };

  const clear = async () => {
    setItems([]);
    if (user) {
      await persist(`${API.shopping}/clear`, { method: 'DELETE', headers: authHeaders() });
    }
  };

  const total = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, add, remove, updateQuantity, clear, reload: loadFromDb, total, totalItems, loading, error }}>
      {children}
    </CartContext.Provider>
  );
};
