import { FREE_SHIPPING_THRESHOLD, DELIVERY_FEE } from '../../lib/shipping';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { verifyToken } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { simulationEnabled } from '../employee/employee.domain';
import { paymentsService } from './payments.service';
import { demoCheckoutSchema, demoKeyParams, demoResolveSchema } from './payments.schema';

const router = Router();
router.use(verifyToken);
router.get('/config', (_req, res) => {
  res.json({ enabled: simulationEnabled(), simulated: true, currency: 'COP', shipping: { deliveryFee: DELIVERY_FEE, freeFrom: FREE_SHIPPING_THRESHOLD, basis: 'subtotal_before_discount' } });
});
router.use(rateLimit({
  windowMs: 60000, limit: 60, standardHeaders: true, legacyHeaders: false,
  message: { message: 'Demasiados intentos de pago. Espera un minuto.' },
}));
router.post('/demo/checkout', validate({ body: demoCheckoutSchema }), asyncHandler(async (req, res) => {
  res.json(await paymentsService.checkout(req.body, (req as any).user));
}));
router.get('/demo/:key', validate({ params: demoKeyParams }), asyncHandler(async (req, res) => {
  res.json(await paymentsService.get(req.params.key, (req as any).user));
}));
router.post('/demo/:key/resolve', validate({ params: demoKeyParams, body: demoResolveSchema }), asyncHandler(async (req, res) => {
  res.json(await paymentsService.resolve(req.params.key, req.body.outcome, (req as any).user));
}));
export default router;
