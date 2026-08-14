// Mapea los valores de estado (en inglés, del backend) a etiquetas en español
// para mostrar al usuario. Los <option value="..."> siguen usando el valor en inglés.

export const orderStatusLabel: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  preparing: 'En preparación',
  shipped: 'Enviado',
  delivered: 'Entregado',
  canceled: 'Cancelado',
  returned: 'Devuelto',
};

export const paymentStatusLabel: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  refunded: 'Reembolsado',
};

export const receiptStatusLabel: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagada',
  partial: 'Parcial',
  overdue: 'Vencida',
  voided: 'Anulada',
};

export const shipmentStatusLabel: Record<string, string> = {
  in_transit: 'En camino',
  delivered: 'Entregado',
  returned: 'Devuelto',
  canceled: 'Cancelado',
};

export const returnStatusLabel: Record<string, string> = {
  requested: 'Solicitada',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  refunded: 'Reembolsada',
};
