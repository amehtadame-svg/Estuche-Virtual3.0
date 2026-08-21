import { Router } from 'express';
import { verifyToken, verifyAdmin } from '../../middlewares/auth.middleware';
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

// Los detalles de pedido se crean desde el servicio de órdenes (Prisma).
// El CRUD HTTP es exclusivo de administradores (C-01).
router.get('/',       verifyToken, verifyAdmin, listOrderDetails);
router.post('/',      verifyToken, verifyAdmin, validate({ body: createOrderDetailSchema }), createOrderDetail);
router.put('/:id',    verifyToken, verifyAdmin, validate({ params: uuidParam, body: updateOrderDetailSchema }), updateOrderDetail);
router.delete('/:id', verifyToken, verifyAdmin, validate({ params: uuidParam }), deleteOrderDetail);

export default router;
