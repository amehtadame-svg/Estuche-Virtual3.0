import {
  BASE,
  authHeaders,
} from '../../api/api';

export const EMPLOYEE_API =
  `${BASE}/api/employee`;

export async function moduleApi<T>(
  module: string,
  path: string,
  body?: unknown,
  method = body === undefined ? 'GET' : 'POST',
  signal?: AbortSignal
): Promise<T> {
  const response = await fetch(
    `${BASE}/api/${module}${path}`,
    {
      method,
      headers: authHeaders(),
      cache: 'no-store',
      ...(
        body === undefined
          ? {}
          : {
              body: JSON.stringify(body),
            }
      ),
      signal,
    }
  );

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    const detail =
      data?.errors?.[0]?.message;

    throw new Error(
      `${
        data?.message ||
        `Error ${response.status}`
      }${
        detail ? `: ${detail}` : ''
      }`
    );
  }

  return data as T;
}

export const employeeApi = <T,>(path: string, body?: unknown, method?: string, signal?: AbortSignal) => moduleApi<T>('employee', path, body, method, signal);
export const supervisionApi = <T,>(path: string, body?: unknown, method?: string, signal?: AbortSignal) => moduleApi<T>('supervision', path, body, method, signal);
export const clientApi = <T,>(path: string, body?: unknown, method?: string, signal?: AbortSignal) => moduleApi<T>('client', path, body, method, signal);
export const deliveryApi = <T,>(path: string, body?: unknown, method?: string, signal?: AbortSignal) => moduleApi<T>('delivery', path, body, method, signal);

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  price: string;
  stock: number;
  stockMin: number;
}

export interface Person {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface Job {
  id: string;
  total: string;
  status?: string;
  orderDate: string;
  fulfillmentMethod: 'pickup' | 'delivery';
  customer?: Person;
  createdById?: string;
  deliverySnapshot?: string;
  expiresAt?: string;

  work?: {
    assigneeId: string;
    assignee: Person;
    status: string;
    incident?: string;
    packedAt?: string;
  } | null;

  receipt?: {
    receiptNumber: number;
    paymentStatus: string;
  };

  details?: {
    id: string;
    quantity: number;
    pickedQuantity: number;
    product: Product;
  }[];

  events?: Activity[];

  shipments?: {
    id: string;
    status: string;
  }[];
}

export interface Activity {
  id: string;
  orderId: string;
  action: string;
  note?: string;
  createdAt: string;
  actor?: Person;
}

export interface Movement {
  id: string;
  type: string;
  quantity: number;
  reason: string;
  date: string;
  product: Product;
  user?: Person;
}

export interface Summary {
  available: number;
  picking: number;
  packed: number;
  blocked: number;
  lowStock: Product[];
  recent: Activity[];
  supervisor: boolean;
  paymentSimulation: boolean;
}

export const money = (
  value: string | number
) =>
  new Intl.NumberFormat(
    'es-CO',
    {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 2,
    }
  ).format(Number(value));

export const date = (
  value?: string
) =>
  value
    ? new Date(value).toLocaleString('es-CO')
    : '—';

export const labels: Record<string, string> = {
  pending: 'Pendiente de pago',
  paid: 'Pagado',
  preparing: 'En preparación',
  shipped: 'Enviado',
  delivered: 'Entregado',
  canceled: 'Cancelado',
  returned: 'Devuelto',

  picking: 'Recogiendo productos',
  packed: 'Empacado',
  blocked: 'Incidencia',
  dispatched: 'Con el repartidor',
  completed: 'Finalizado',

  delivery: 'Domicilio',
  pickup: 'Retiro en tienda',

  created: 'Pedido registrado',
  claimed: 'Pedido tomado',
  picking_updated: 'Recogida actualizada',
  incident: 'Incidencia',
  incident_resolved: 'Incidencia resuelta',
  reassigned: 'Reasignación',
  payment_confirmed: 'Pago confirmado',
  store_payment_registered: 'Pago en tienda registrado',
  demo_checkout: 'Pago de demostración iniciado',
  demo_payment_approved: 'Pago de demostración aprobado',
  demo_payment_rejected: 'Pago de demostración rechazado',
  payment_approved: 'Pago aprobado',
  payment_rejected: 'Pago rechazado',

  simulation_approved:
    'Pago de prueba aprobado',
  simulation_rejected:
    'Pago de prueba rechazado',

  pickup_code_issued:
    'Código de retiro generado',
  picked_up: 'Retirado en tienda',
  delivery_confirmed:
    'Entrega confirmada',
  expired: 'Reserva vencida',
};