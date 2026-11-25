const getBaseUrl = () => {
  // Prioridad documentada en fe/.env-example (C-07):
  //   1. VITE_API_URL explícita (que no apunte a localhost) → Docker/producción
  //   2. Detección de plataforma (Arena/e2b, Codespaces)    → entornos con proxy
  //   3. VITE_API_URL apuntando a localhost                 → desarrollo local
  //   4. localhost:4000                                     → fallback
  const explicit = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

  if (explicit && !explicit.includes('localhost')) {
    return explicit.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    const host = window.location.host;

    if (
      window.location.hostname.endsWith('.e2b.app')
    ) {
      return window.location.origin;
    }

    if (
      host.includes('.app.github.dev') ||
      host.includes('.github.dev')
    ) {
      return `https://${host.replace(
        /-(3000|5173|4173)\./,
        '-4000.'
      )}`;
    }
  }

  if (explicit) {
    return explicit.replace(/\/+$/, '');
  }

  return 'http://localhost:4000';
};

export const BASE = getBaseUrl();

export const API = {
  auth: `${BASE}/api/auth`,
  users: `${BASE}/api/users`,
  orders: `${BASE}/api/orders`,
  orderDetails: `${BASE}/api/order-details`,
  products: `${BASE}/api/products`,
  combos: `${BASE}/api/combos`,
  categories: `${BASE}/api/categories`,
  inventory: `${BASE}/api/inventory`,
  providers: `${BASE}/api/providers`,
  despatches: `${BASE}/api/despatches`,
  receipts: `${BASE}/api/receipts`,
  shopping: `${BASE}/api/shopping`,
  promotionalCodes: `${BASE}/api/promotional-codes`,
  payouts: `${BASE}/api/payouts`,
  returns: `${BASE}/api/returns`,
  pqr: `${BASE}/api/pqr`,
  reports: `${BASE}/api/reports`,
};

export const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${
    localStorage.getItem('token') ?? ''
  }`,
});