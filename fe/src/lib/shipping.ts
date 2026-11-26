// El umbral usa el subtotal de productos antes de cupones. Retiro en tienda: gratis.
export const FREE_SHIPPING_THRESHOLD = 120_000;
export const DELIVERY_FEE = 10_000;
export function shippingCost(subtotal: number, pickup = false) {
  return pickup || subtotal <= 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DELIVERY_FEE;
}
