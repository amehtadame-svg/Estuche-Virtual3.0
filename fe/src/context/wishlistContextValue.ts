import { createContext } from 'react';

export interface WishlistItem {
  id: string;
  productId: string;
  addedAt: string | null;
  product: { id: string; name: string; price: number | string; stock: number; deletedAt: string | null; category: { name: string } | null; images: { url: string; isPrimary: boolean | null }[] };
}
export interface State { owner: string; items: WishlistItem[]; loading: boolean; error: string; busy: string[] }
interface WishlistValue extends State { toggle: (productId: string) => Promise<void>; reload: () => void }
export const WishlistContext = createContext<WishlistValue | undefined>(undefined);
