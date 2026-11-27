import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useWishlist } from '../../hooks/useWishlist';
import { notify } from '../../lib/notifications';

export default function FavoriteButton({ productId, productName, className }: { productId: string; productName: string; className: string }) {
  const { user, loading: authLoading } = useAuth();
  const { items, loading, error, busy, toggle, reload } = useWishlist();
  const navigate = useNavigate();
  if (!authLoading && user && user.role !== 'client') return null;
  const selected = items.some(item => item.productId === productId);
  return <button type="button" className={`${className} ${selected ? 'on' : ''}`} aria-pressed={selected}
    aria-label={`${selected ? 'Quitar' : 'Guardar'} ${productName} ${selected ? 'de' : 'en'} favoritos`}
    disabled={authLoading || (!!user && (loading || busy.length > 0))}
    onClick={() => {
      if (!user) { notify.info('Inicia sesión como cliente para guardar tus favoritos.'); navigate('/login'); return; }
      if (error) { reload(); return; }
      void toggle(productId);
    }}>
    <Heart size={16} fill={selected ? 'currentColor' : 'none'} aria-hidden="true" />
    {className === 'pd-favorite' && <span>{error ? 'Reintentar favoritos' : selected ? 'Guardado en favoritos' : 'Guardar en favoritos'}</span>}
  </button>;
}
