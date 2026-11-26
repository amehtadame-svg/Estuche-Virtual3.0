/** Referencia visual estable. Los UUID completos se conservan solo para API/rutas. */
export function shortReference(id: string | null | undefined) {
  return id ? id.replace(/-/g, '').slice(-8).toUpperCase() : '—';
}
export const orderReference = (id: string | null | undefined) => `PED-${shortReference(id)}`;

export function referenceText(value: string | null | undefined) {
  return (value ?? '').replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, shortReference);
}
