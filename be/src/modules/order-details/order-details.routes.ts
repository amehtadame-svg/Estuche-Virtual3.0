import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { uuidParam } from '../../lib/schemas';
import { createOrderDetailSchema, updateOrderDetailSchema } from './order-details.schema';
import {
  listOrderDetails,
  createOrderDetail,
  updateOrderDetail,
  deleteOrderDetail,
} from './order-details.controller';

const router = Router();

router.get('/',       listOrderDetails);
router.post('/',      validate({ body: createOrderDetailSchema }), createOrderDetail);
router.put('/:id',    validate({ params: uuidParam, body: updateOrderDetailSchema }), updateOrderDetail);
router.delete('/:id', validate({ params: uuidParam }), deleteOrderDetail);

export default router;
