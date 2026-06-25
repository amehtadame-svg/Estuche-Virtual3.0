const getBaseURL = () => {
  const host = window.location.host;
  if (host.includes('.app.github.dev')) {
    return `https://${host.replace(/-(3000|5173|4173)\./, '-4000.')}`;
  }
  return 'http://localhost:4000';
};

export const BASE = getBaseURL();
export const API = {
  auth:      `${BASE}/api/auth`,
  usuarios:  `${BASE}/api/usuarios`,
  pedidos:   `${BASE}/api/pedidos`,
  proveedores: `${BASE}/api/proveedores`,
  productos:   `${BASE}/api/productos`,
  envios:      `${BASE}/api/envios`,
  detalle:     `${BASE}/api/detalle-pedido`,
  facturas: `${BASE}/api/facturas`,
};