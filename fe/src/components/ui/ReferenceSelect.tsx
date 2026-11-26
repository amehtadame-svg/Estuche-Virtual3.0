import { useEffect, useState, type ChangeEvent } from 'react';
import { authHeaders } from '../../api/api';
import { orderReference, shortReference } from '../../lib/reference';

interface Props {
  endpoint: string;
  kind: 'order' | 'product' | 'customer';
  value: string;
  name?: string;
  className?: string;
  disabled?: boolean;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}

/** El formulario conserva la FK, pero el usuario elige una referencia o un nombre. */
export default function ReferenceSelect({ endpoint, kind, value, name, className, disabled, onChange }: Props) {
  const [options, setOptions] = useState<{ id: string; name?: string; fullName?: string; role?: string; customer?: { fullName: string } | null }[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState('loading');
    fetch(endpoint, { headers: authHeaders(), signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error();
      return data;
    }).then(data => { setOptions(data); setState('ready'); }).catch(() => { if (!controller.signal.aborted) setState('error'); });
    return () => controller.abort();
  }, [endpoint, retry]);
  return <>
    <select className={className} name={name} value={value} onChange={onChange} disabled={disabled || state !== 'ready'} aria-label={kind === 'order' ? 'Pedido' : kind === 'product' ? 'Producto' : 'Cliente'}>
      <option value="">{state === 'loading' ? 'Cargando opciones…' : state === 'error' ? 'No se pudieron cargar las opciones' : 'Selecciona una opción'}</option>
      {value && !options.some(option => option.id === value) && <option value={value}>{kind === 'order' ? orderReference(value) : `Referencia ${shortReference(value)}`}</option>}
      {options.filter(option => kind !== 'customer' || option.role === 'client').map(option => <option key={option.id} value={option.id}>{kind === 'order' ? `${orderReference(option.id)}${option.customer?.fullName ? ` · ${option.customer.fullName}` : ''}` : `${option.fullName ?? option.name ?? 'Sin nombre'} · ${shortReference(option.id)}`}</option>)}
    </select>
    {state === 'error' && <button type="button" onClick={() => setRetry(current => current + 1)}>Reintentar cargar opciones</button>}
  </>;
}
