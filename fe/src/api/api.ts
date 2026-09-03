const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.host;
    if (host.includes('.app.github.dev') || host.includes('.github.dev')) {
      return `https://${host.replace(/-(3000|5173|4173)\./, '-4000.')}`;
    }
  }

  const explicit = import.meta.env.VITE_API_URL as string | undefined;
  if (explicit && explicit.trim() !== '' && !explicit.includes('localhost')) {
    return explicit.replace(/\/+$/, '');
  }

  return 'http://localhost:4000';
};

export const BASE = getBaseUrl();

export const API = {
  auth:              `${BASE}/api/auth`,
  users:             `${BASE}/api/users`,
  orders:            `${BASE}/api/orders`,
  orderDetails:      `${BASE}/api/order-details`,
  products:          `${BASE}/api/products`,
  providers:         `${BASE}/api/providers`,
  despatches:        `${BASE}/api/despatches`,
  receipts:          `${BASE}/api/receipts`,
  shopping:          `${BASE}/api/shopping`,
  promotionalCodes:  `${BASE}/api/promotional-codes`,
  payouts:           `${BASE}/api/payouts`,
  returns:           `${BASE}/api/returns`,
  reports:           `${BASE}/api/reports`,
};

export const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
});