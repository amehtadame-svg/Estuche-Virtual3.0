import { Prisma } from '@prisma/client';
import { badRequest } from '../../lib/errors';

export const normalizeCoupon = (code: string) => code.normalize('NFKC').trim();
interface Coupon {
  active: boolean | null; type: string; value: unknown; minPurchase: unknown;
  startDate: Date; endDate: Date; maxUses: number | null; currentUses: number | null;
}
/** Misma regla en validación previa y checkout transaccional. */
export function assertCoupon(promo: Coupon | null, subtotal?: number): asserts promo is Coupon {
  if (!promo) throw badRequest('No encontramos ese cupón. Revisa el código e intenta de nuevo.');
  if (!promo.active) throw badRequest('Este cupón no está activo.');
  const today = new Date().toISOString().slice(0, 10);
  if (today < promo.startDate.toISOString().slice(0, 10)) throw badRequest('Este cupón aún no está disponible.');
  if (today > promo.endDate.toISOString().slice(0, 10)) throw badRequest('Este cupón ha expirado.');
  const minimum = Number(promo.minPurchase ?? 0);
  if (subtotal !== undefined && subtotal < minimum) throw badRequest(`Este cupón requiere al menos $${minimum.toLocaleString('es-CO')} en productos. Te faltan $${(minimum - subtotal).toLocaleString('es-CO')}.`, { minimumPurchase: minimum, missingAmount: minimum - subtotal });
  if (promo.maxUses !== null && (promo.currentUses ?? 0) >= promo.maxUses) throw badRequest('Este cupón alcanzó su límite de usos.');
  if (Number(promo.value) <= 0 || (promo.type === 'percentage' && Number(promo.value) > 100)) throw badRequest('Este cupón tiene un descuento no válido. Contacta con soporte.');
}

export function couponDiscount(subtotal: Prisma.Decimal, promo: { type: string; value: unknown }) {
  const amount = promo.type === 'percentage' ? subtotal.mul(Number(promo.value)).div(100) : new Prisma.Decimal(Number(promo.value));
  return Prisma.Decimal.min(subtotal, amount).toDecimalPlaces(2);
}
