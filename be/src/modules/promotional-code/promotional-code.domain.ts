import { Prisma } from '@prisma/client';
import { badRequest } from '../../lib/errors';
import { toDateKey } from '../../lib/reportDate';

export const normalizeCoupon = (code: string) => code.normalize('NFKC').trim();
interface Coupon {
  active: boolean | null; type: string; value: unknown; minPurchase: unknown;
  startDate: Date; endDate: Date; maxUses: number | null; currentUses: number | null;
}
/** Misma regla en validación previa y checkout transaccional. */
export function assertCoupon(promo: Coupon | null, subtotal?: number): asserts promo is Coupon {
  if (!promo) throw badRequest('No encontramos ese cupón. Revisa el código e intenta de nuevo.');
  if (!promo.active) throw badRequest('Este cupón no está activo.');
  // Vigencia por día calendario, con dos relojes distintos a propósito:
  //  - `startDate`/`endDate` se guardan como MEDIANOCHE UTC del día elegido en
  //    el formulario, así que su día se recupera en UTC. Interpretarlos en
  //    Bogotá los haría retroceder un día (00:00Z = 19:00 del día anterior).
  //  - "Hoy" se mide en Colombia, para que un cupón que vence hoy siga válido
  //    hasta la medianoche local y no expire a las 19:00.
  const today = toDateKey(new Date()) ?? '';
  const startDay = promo.startDate.toISOString().slice(0, 10);
  const endDay = promo.endDate.toISOString().slice(0, 10);
  if (today < startDay) throw badRequest('Este cupón aún no está disponible.');
  if (today > endDay) throw badRequest('Este cupón ha expirado.');
  const minimum = Number(promo.minPurchase ?? 0);
  if (subtotal !== undefined && subtotal < minimum) throw badRequest(`Este cupón requiere al menos $${minimum.toLocaleString('es-CO')} en productos. Te faltan $${(minimum - subtotal).toLocaleString('es-CO')}.`, { minimumPurchase: minimum, missingAmount: minimum - subtotal });
  if (promo.maxUses !== null && (promo.currentUses ?? 0) >= promo.maxUses) throw badRequest('Este cupón alcanzó su límite de usos.');
  if (Number(promo.value) <= 0 || (promo.type === 'percentage' && Number(promo.value) > 100)) throw badRequest('Este cupón tiene un descuento no válido. Contacta con soporte.');
}

export function couponDiscount(subtotal: Prisma.Decimal, promo: { type: string; value: unknown }) {
  const amount = promo.type === 'percentage' ? subtotal.mul(Number(promo.value)).div(100) : new Prisma.Decimal(Number(promo.value));
  return Prisma.Decimal.min(subtotal, amount).toDecimalPlaces(2);
}

const COUPON_LOCK = (id: string) => `coupon:${id}`;

/**
 * A-07: consumo del cupón a prueba de concurrencia.
 *
 * 1. Bloqueo de asesoría por cupón: serializa dos checkouts simultáneos del
 *    mismo código, incluso si llegan desde procesos distintos.
 * 2. Relectura dentro del bloqueo (el estado que se validó antes del lock
 *    puede haber cambiado).
 * 3. Incremento condicional (`currentUses < maxUses`): segunda barrera por si
 *    el lock no se tomó (tests unitarios sin PostgreSQL, por ejemplo).
 *
 * Devuelve el cupón ya validado y con el uso consumido UNA sola vez.
 */
export async function consumeCoupon(
  tx: Prisma.TransactionClient,
  id: string,
  subtotal: number
) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${COUPON_LOCK(id)}, 0))`;

  const promo = await tx.promotionalCode.findUnique({ where: { id } });
  assertCoupon(promo, subtotal);

  const consumed = await tx.promotionalCode.updateMany({
    where: {
      id: promo.id,
      active: true,
      ...(promo.maxUses !== null ? { currentUses: { lt: promo.maxUses } } : {}),
    },
    data: { currentUses: { increment: 1 } },
  });

  if (consumed.count !== 1) {
    throw badRequest('Este cupón alcanzó su límite de usos.');
  }

  return promo;
}
