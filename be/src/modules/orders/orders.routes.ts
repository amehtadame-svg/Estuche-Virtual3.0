import { Router } from 'express';
import { verifyToken, verifyAdmin } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate';
import { uuidParam } from '../../lib/schemas';
import {
  createOrderSchema,
  updateOrderSchema,
  applyPromotionalCodeSchema,
} from './orders.schema';
import {
  listOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  applyPromotionalCode,
} from './orders.controller';

const router = Router();

router.use(verifyToken);

router.get('/', listOrders);

router.get(
  '/:id',
  validate({ params: uuidParam }),
  getOrder
);

router.post(
  '/',
  validate({ body: createOrderSchema }),
  createOrder
);

router.put(
  '/:id',
  verifyAdmin,
  validate({ params: uuidParam, body: updateOrderSchema }),
  updateOrder
);

router.delete(
  '/:id',
  verifyAdmin,
  validate({ params: uuidParam }),
  deleteOrder
);

router.patch(
  '/:id/apply-code',
  validate({ params: uuidParam, body: applyPromotionalCodeSchema }),
  applyPromotionalCode
);

export default router;