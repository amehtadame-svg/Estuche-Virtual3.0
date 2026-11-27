import { useContext } from 'react';
import { WishlistContext } from '../context/wishlistContextValue';
export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist debe usarse dentro de WishlistProvider');
  return context;
}
