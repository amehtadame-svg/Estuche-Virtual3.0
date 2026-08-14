import { Router } from 'express';
import { verifyToken } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate';
import { uuidParam } from '../../lib/schemas';
import { createOrderSchema, updateOrderSchema, applyPromotionalCodeSchema } from './orders.schema';
import {
  listOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  applyPromotionalCode,
} from './orders.controller';

const router = Router();

router.get('/',                          listOrders);
router.get('/:id',                       validate({ params: uuidParam }), getOrder);
router.post('/',                         verifyToken, validate({ body: createOrderSchema }), createOrder);
router.put('/:id',                       validate({ params: uuidParam, body: updateOrderSchema }), updateOrder);
router.delete('/:id',                    validate({ params: uuidParam }), deleteOrder);
router.patch('/:id/apply-code',          verifyToken, validate({ params: uuidParam, body: applyPromotionalCodeSchema }), applyPromotionalCode);

export default router;
