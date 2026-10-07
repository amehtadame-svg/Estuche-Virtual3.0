import { createContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
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
  add: (product: Omit<CartItem, 'quantity'>, quantity?: number) => Promise<void>;
  remove: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clear: () => Promise<void>;
  total: number;
  totalItems: number;
  loading: boolean;
  /** Último error al sincronizar con el servidor (null si todo va bien). */
  error: string | null;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

const iconsByCategory: Record<string, string> = {
  Cuadernos: '📓',
  Lapices: '✏️',
  Escritura: '✏️',
  Colores: '🎨',
  Arte: '🖌️',
  Oficina: '📁',
  Mochilas: '🎒',
  Tecnologia: '💻',
  Papeleria: '📄',
};

const GUEST_KEY = 'estuche:carrito:invitado';

/** Carrito en localStorage para quien todavía no ha iniciado sesión. */
const readGuestCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeGuestCart = (items: CartItem[]) => {
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(items));
  } catch {
    /* almacenamiento lleno o bloqueado: el carrito sigue en memoria */
  }
};

/**
 * Une dos listas de artículos sumando cantidades del mismo producto.
 * No muta ninguna de las dos: así el estado anterior sigue intacto y se puede
 * deshacer el cambio si el servidor rechaza la operación.
 */
const mergeItems = (a: CartItem[], b: CartItem[]): CartItem[] => {
  const out = a.map((item) => ({ ...item }));
  for (const item of b) {
    const found = out.find((i) => i.id === item.id);
    if (found) found.quantity += item.quantity;
    else out.push({ ...item });
  }
  return out;
};

const errorMessage = async (res: Response, fallback: string) => {
  try {
    const data = await res.json();
    return data?.message ?? fallback;
  } catch {
    return fallback;
  }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mergedFor = useRef<string | null>(null);

  // Carga el carrito: de la BD si hay sesión, de localStorage si es invitado.
  const load = useCallback(async () => {
    // Invitado: se recupera lo que dejó guardado en el navegador.
    if (!user) {
      mergedFor.current = null;
      setItems(readGuestCart());
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API.shopping}`, { headers: authHeaders() });
      if (!res.ok) throw new Error(await errorMessage(res, 'No se pudo cargar el carrito.'));
      const data = await res.json();
      const fromDb: CartItem[] = data.map((item: any) => {
        const category = item.product?.category?.name ?? '';
        return {
          id: item.productId,
          name: item.product?.name ?? '',
          price: Number(item.product?.price ?? 0),
          category,
          icon: iconsByCategory[category] ?? '📦',
          quantity: Number(item.quantity ?? 1),
        };
      });

      // La primera vez que se inicia sesión, el carrito de invitado se sube a
      // la BD (merge) para no perder lo que el cliente ya había elegido.
      const guest = readGuestCart();
      if (guest.length > 0 && mergedFor.current !== user.id) {
        mergedFor.current = user.id;

        // Solo se envía la diferencia: si el producto ya estaba en el carrito
        // de la BD se suman únicamente las unidades nuevas.
        for (const guestItem of guest) {
          const inDb = fromDb.find((i) => i.id === guestItem.id);
          const delta = guestItem.quantity - (inDb?.quantity ?? 0);
          if (delta > 0) {
            await fetch(`${API.shopping}`, {
              method: 'POST',
              headers: authHeaders(),
              body: JSON.stringify({ productId: guestItem.id, quantity: delta }),
            });
          }
        }
        writeGuestCart([]);

        const resMerged = await fetch(`${API.shopping}`, { headers: authHeaders() });
        if (resMerged.ok) {
          const mergedData = await resMerged.json();
          setItems(
            mergedData.map((item: any) => {
              const category = item.product?.category?.name ?? '';
              return {
                id: item.productId,
                name: item.product?.name ?? '',
                price: Number(item.product?.price ?? 0),
                category,
                icon: iconsByCategory[category] ?? '📦',
                quantity: Number(item.quantity ?? 1),
              };
            })
          );
        } else {
          setItems(mergeItems(fromDb, guest));
        }
      } else {
        setItems(fromDb);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el carrito.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (product: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setError(null);
    const prev = items;
    const next = mergeItems(items, [{ ...product, quantity }]);

    // Sin sesión: el carrito vive en el navegador hasta que inicie sesión.
    if (!user) {
      writeGuestCart(next);
      setItems(next);
      return;
    }

    setItems(next); // actualización optimista
    try {
      const res = await fetch(`${API.shopping}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ productId: product.id, quantity }),
      });
      if (!res.ok) {
        setItems(prev);
        setError(await errorMessage(res, 'No se pudo agregar el producto al carrito.'));
        return;
      }
      await load(); // la BD es la fuente de verdad de las cantidades
    } catch {
      setItems(prev);
      setError('No se pudo conectar con el servidor. Revisa tu conexión.');
    }
  };

  const remove = async (id: string) => {
    setError(null);
    const prev = items;
    const next = items.filter((i) => i.id !== id);

    if (!user) {
      writeGuestCart(next);
      setItems(next);
      return;
    }

    setItems(next);
    try {
      const res = await fetch(`${API.shopping}/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) {
        setItems(prev);
        setError(await errorMessage(res, 'No se pudo quitar el producto del carrito.'));
      }
    } catch {
      setItems(prev);
      setError('No se pudo conectar con el servidor. Revisa tu conexión.');
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity < 1) return remove(id);
    setError(null);
    const prev = items;
    const next = items.map((i) => (i.id === id ? { ...i, quantity } : i));

    if (!user) {
      writeGuestCart(next);
      setItems(next);
      return;
    }

    setItems(next);
    try {
      const res = await fetch(`${API.shopping}/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) {
        setItems(prev);
        setError(await errorMessage(res, 'No se pudo actualizar la cantidad.'));
        return;
      }
      await load();
    } catch {
      setItems(prev);
      setError('No se pudo conectar con el servidor. Revisa tu conexión.');
    }
  };

  const clear = async () => {
    setError(null);
    const prev = items;
    setItems([]);
    writeGuestCart([]);

    if (!user) return;

    try {
      const res = await fetch(`${API.shopping}/clear`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) {
        setItems(prev);
        setError(await errorMessage(res, 'No se pudo vaciar el carrito.'));
      }
    } catch {
      setItems(prev);
      setError('No se pudo conectar con el servidor. Revisa tu conexión.');
    }
  };

  const total = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, add, remove, updateQuantity, clear, total, totalItems, loading, error }}>
      {children}
    </CartContext.Provider>
  );
};
