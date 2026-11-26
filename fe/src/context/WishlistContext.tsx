import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { API, authHeaders } from '../api/api';
import { useAuth } from '../hooks/useAuth';
import { notify } from '../lib/notifications';
import { WishlistContext, type WishlistItem, type State } from './wishlistContextValue';

const empty = (owner: string, loading = false): State => ({ owner, items: [], loading, error: '', busy: [] });

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const owner = !authLoading && user?.role === 'client' ? `${user.id}:${localStorage.getItem('token') ?? ''}` : '';
  const [state, setState] = useState<State>(() => empty(''));
  const [revision, setRevision] = useState(0);
  const activeOwner = useRef(owner);
  activeOwner.current = owner;
  const locks = useRef(new Set<string>());
  const reload = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    locks.current = new Set();
    const controller = new AbortController();
    if (!owner) { setState(empty('')); return () => controller.abort(); }
    setState(empty(owner, true));
    fetch(API.wishlist, { headers: authHeaders(), signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error(response.status === 401 ? 'Tu sesión venció. Vuelve a iniciar sesión.' : 'No pudimos cargar tus favoritos.');
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('Respuesta inválida al consultar favoritos.');
        return data as WishlistItem[];
      })
      .then(items => { if (!controller.signal.aborted && activeOwner.current === owner) setState({ owner, items, loading: false, error: '', busy: [] }); })
      .catch(error => { if (!controller.signal.aborted && activeOwner.current === owner) setState({ ...empty(owner), error: error instanceof TypeError ? 'No pudimos conectar con el servidor.' : error.message }); });
    return () => controller.abort();
  }, [owner, revision]);

  const visible = state.owner === owner ? state : empty(owner, !!owner);
  const toggle = async (productId: string) => {
    const lock = locks.current;
    if (!owner || visible.loading || visible.error || lock.size > 0) return;
    const selected = visible.items.some(item => item.productId === productId);
    lock.add(productId);
    setState(current => current.owner === owner ? { ...current, busy: [...current.busy, productId] } : current);
    try {
      const response = await fetch(selected ? `${API.wishlist}/${productId}` : API.wishlist, {
        method: selected ? 'DELETE' : 'POST', headers: authHeaders(), ...(selected ? {} : { body: JSON.stringify({ productId }) }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || 'No pudimos actualizar tus favoritos.');
      }
      const item: WishlistItem | null = selected ? null : await response.json();
      if (activeOwner.current !== owner) return;
      setState(current => current.owner === owner ? { ...current, items: item ? [item, ...current.items.filter(row => row.productId !== productId)] : current.items.filter(row => row.productId !== productId) } : current);
    } catch (error) {
      if (activeOwner.current === owner) {
        notify.error(error instanceof TypeError ? 'No pudimos conectar con el servidor. Consultaremos de nuevo el estado.' : (error as Error).message);
        reload(); // Un fallo de red puede ocurrir después de que el servidor guardó el cambio.
      }
    } finally {
      lock.delete(productId);
      if (activeOwner.current === owner) setState(current => current.owner === owner ? { ...current, busy: current.busy.filter(id => id !== productId) } : current);
    }
  };
  return <WishlistContext.Provider value={{ ...visible, toggle, reload }}>{children}</WishlistContext.Provider>;
}
