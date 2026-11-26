import { Router } from 'express';
import { verifyToken } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { validate } from '../../middlewares/validate';
import { uuidParam } from '../../lib/schemas';
import { badRequest, conflict, forbidden, notFound } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { atomic, event, financiallyPaid, lockOrder } from '../employee/employee.domain';

const router = Router();
router.use(verifyToken, (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  if ((req as any).user.role !== 'delivery') return next(forbidden());
  next();
});
router.get('/despatches', asyncHandler(async (req, res) => {
  res.json(await prisma.despatch.findMany({
    where: { driverId: (req as any).user.id, status: 'in_transit', order: { deletedAt: null, status: 'shipped', work: { is: { status: 'dispatched' } } } },
    select: { id: true, address: true, shipDate: true, order: { select: { id: true, customer: { select: { fullName: true, phone: true } } } } },
    orderBy: { shipDate: 'asc' }, take: 100,
  }));
}));
router.post('/despatches/:id/confirm', validate({ params: uuidParam }), asyncHandler(async (req, res) => {
  if (req.body && Object.keys(req.body).length) throw badRequest('Esta operación no acepta campos.');
  const actorId = (req as any).user.id as string;
  const initial = await prisma.despatch.findUnique({ where: { id: req.params.id }, select: { orderId: true } });
  if (!initial) throw notFound();
  const result = await atomic(async tx => {
    const order = await lockOrder(tx, initial.orderId);
    const shipment = await tx.despatch.findUnique({ where: { id: req.params.id } });
    if (!shipment || shipment.driverId !== actorId) throw notFound();
    if (shipment.status === 'delivered' && order.status === 'delivered' && order.work?.status === 'completed') return shipment;
    if (shipment.status !== 'in_transit' || order.status !== 'shipped' || order.work?.status !== 'dispatched' || !financiallyPaid(order)) throw conflict('Pedido no habilitado para entrega.');
    const deliveredAt = new Date();
    const updated = await tx.despatch.update({ where: { id: shipment.id }, data: { status: 'delivered', deliveredAt } });
    await tx.order.update({ where: { id: order.id }, data: { status: 'delivered' } });
    await tx.orderWork.update({ where: { orderId: order.id }, data: { status: 'completed', completedAt: deliveredAt } });
    await event(tx, order.id, actorId, 'delivery_confirmed');
    return updated;
  });
  res.json(result);
}));
export default router;
