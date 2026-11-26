export const formatCOP = (amount: number | string) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 2,
}).format(Number(amount));

// La API devuelve la ruta del campo inválido; no mostrar solo «Invalid UUID».
export function paymentErrorMessage(data: unknown): string {
  if (!data || typeof data !== 'object') return 'No se pudo registrar el pago.';
  const body = data as { message?: unknown; errors?: unknown };
  const first = Array.isArray(body.errors) ? body.errors[0] : null;
  if (first && typeof first === 'object') {
    const issue = first as { code?: unknown; format?: unknown; path?: unknown; message?: unknown };
    const path = Array.isArray(issue.path) ? issue.path : [];
    if (path[0] === 'items' && typeof path[1] === 'number' && path[2] === 'productId') {
      return `El identificador del producto ${path[1] + 1} del carrito no es válido. Quita ese producto y agrégalo de nuevo desde el catálogo.`;
    }
    if (path[0] === 'requestKey') {
      return 'La referencia del intento de pago no es válida. Recarga la página y vuelve a intentarlo.';
    }
    if (typeof issue.message === 'string') return issue.message;
  }
  return typeof body.message === 'string' ? body.message : 'No se pudo registrar el pago.';
}

