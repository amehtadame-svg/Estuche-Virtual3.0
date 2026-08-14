import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { API, authHeaders } from '../api/api';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  category: string;
  icon: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  add: (product: Omit<CartItem, 'quantity'>) => void;
  remove: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  total: number;
  totalItems: number;
  loading: boolean;
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
  const [loading, setLoading] = useState(false);

  // Cargar carrito desde la BD cuando el usuario inicia sesión
  const loadFromDb = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API.shopping}`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      setItems(
        data.map((item: any) => {
          const category = item.product?.category?.name ?? '';
          return {
            id: item.productId,
            name: item.product?.name ?? '',
            price: Number(item.product?.price ?? 0),
            category,
            icon: iconsByCategory[category] ?? '📦',
            quantity: item.quantity,
          };
        })
      );
    } catch {
      // Si falla la BD, el carrito queda vacío
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadFromDb();
  }, [loadFromDb]);

  const add = async (product: Omit<CartItem, 'quantity'>) => {
    // Optimistic update — actualiza UI inmediatamente
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      return [...prev, { ...product, quantity: 1 }];
    });

    // Sincronizar con BD si hay usuario
    if (user) {
      try {
        await fetch(`${API.shopping}`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ productId: product.id, quantity: 1 }),
        });
      } catch {
        /* noop */
      }
    }
  };

  const remove = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (user) {
      try {
        await fetch(`${API.shopping}/${id}`, { method: 'DELETE', headers: authHeaders() });
      } catch {
        /* noop */
      }
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity < 1) return remove(id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
    if (user) {
      try {
        await fetch(`${API.shopping}/${id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ quantity }),
        });
      } catch {
        /* noop */
      }
    }
  };

  const clear = async () => {
    setItems([]);
    if (user) {
      try {
        await fetch(`${API.shopping}/clear`, { method: 'DELETE', headers: authHeaders() });
      } catch {
        /* noop */
      }
    }
  };

  const total = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, add, remove, updateQuantity, clear, total, totalItems, loading }}>
      {children}
    </CartContext.Provider>
  );
};
