import { createContext, useState, useContext, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { API } from '../api';

export interface CartItem {
  id: number;
  nombre: string;
  precio: number;
  categoria: string;
  icono: string;
  cantidad: number;
}

interface CartContextType {
  items: CartItem[];
  agregar: (producto: Omit<CartItem, 'cantidad'>) => void;
  quitar: (id: number) => void;
  cambiarCantidad: (id: number, cantidad: number) => void;
  vaciar: () => void;
  total: number;
  totalItems: number;
  cargando: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const iconosPorCategoria: Record<string, string> = {
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
  const [cargando, setCargando] = useState(false);

  // Cargar carrito desde la BD cuando el usuario inicia sesión
  const cargarDesdeDB = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setCargando(true);
    try {
      const res = await fetch(`${API.carrito}`, { headers: headers() });
      if (!res.ok) return;
      const data = await res.json();
      // Mapear respuesta de BD al formato CartItem
      setItems(data.map((item: any) => {
        const categoria = item.productos?.categorias?.nombre ?? '';
        return {
          id: item.id_producto,
          nombre: item.productos?.nombre ?? '',
          precio: Number(item.productos?.precio ?? 0),
          categoria,
          icono: iconosPorCategoria[categoria] ?? '📦',
          cantidad: item.cantidad,
        };
      }));
    } catch {
      // Si falla la BD, el carrito queda vacío
    } finally {
      setCargando(false);
    }
  }, [user]);

  useEffect(() => { cargarDesdeDB(); }, [cargarDesdeDB]);

  const agregar = async (producto: Omit<CartItem, 'cantidad'>) => {
    // Optimistic update — actualiza UI inmediatamente
    setItems(prev => {
      const existe = prev.find(i => i.id === producto.id);
      if (existe) return prev.map(i => i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...prev, { ...producto, cantidad: 1 }];
    });

    // Sincronizar con BD si hay usuario
    if (user) {
      try {
        await fetch(`${API.carrito}`, {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify({ id_producto: producto.id, cantidad: 1 }),
        });
      } catch { }
    }
  };

  const quitar = async (id: number) => {
    setItems(prev => prev.filter(i => i.id !== id));
    if (user) {
      try {
        await fetch(`${API.carrito}/${id}`, { method: 'DELETE', headers: headers() });
      } catch { }
    }
  };

  const cambiarCantidad = async (id: number, cantidad: number) => {
    if (cantidad < 1) return quitar(id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, cantidad } : i));
    if (user) {
      try {
        await fetch(`${API.carrito}/${id}`, {
          method: 'PUT',
          headers: headers(),
          body: JSON.stringify({ cantidad }),
        });
      } catch { }
    }
  };

  const vaciar = async () => {
    setItems([]);
    if (user) {
      try {
        await fetch(`${API.carrito}/vaciar`, { method: 'DELETE', headers: headers() });
      } catch { }
    }
  };

  const total = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  const totalItems = items.reduce((acc, i) => acc + i.cantidad, 0);

  return (
    <CartContext.Provider value={{ items, agregar, quitar, cambiarCantidad, vaciar, total, totalItems, cargando }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
};