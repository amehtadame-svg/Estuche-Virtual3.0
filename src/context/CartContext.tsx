import { createContext, useState, useContext, type ReactNode } from 'react';

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
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const agregar = (producto: Omit<CartItem, 'cantidad'>) => {
    setItems((prev) => {
      const existe = prev.find((i) => i.id === producto.id);
      if (existe) {
        return prev.map((i) =>
          i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const quitar = (id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const cambiarCantidad = (id: number, cantidad: number) => {
    if (cantidad < 1) return quitar(id);
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, cantidad } : i))
    );
  };

  const vaciar = () => setItems([]);

  const total = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  const totalItems = items.reduce((acc, i) => acc + i.cantidad, 0);

  return (
    <CartContext.Provider value={{ items, agregar, quitar, cambiarCantidad, vaciar, total, totalItems }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
};
