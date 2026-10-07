import { Router } from 'express';
import { verifyToken } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate';
import { uuidParam } from '../../lib/schemas';
import { createOrderSchema, updateOrderSchema, applyPromotionalCodeSchema } from './orders.schema';
import {
  listOrders,
  listMyOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  applyPromotionalCode,
} from './orders.controller';

const router = Router();

// C-01: los pedidos son datos personales; ninguna ruta queda abierta.
// Antes PUT y DELETE no pedían token: cualquiera podía cambiar el estado de un
// pedido desde fuera de la aplicación.
router.use(verifyToken);

router.get('/',                 verifyToken, listOrders);
router.get('/mine',             verifyToken, listMyOrders);
router.get('/:id',              verifyToken, validate({ params: uuidParam }), getOrder);
router.post('/',                verifyToken, validate({ body: createOrderSchema }), createOrder);
router.put('/:id',              verifyToken, validate({ params: uuidParam, body: updateOrderSchema }), updateOrder);
router.delete('/:id',           verifyToken, validate({ params: uuidParam }), deleteOrder);
router.patch('/:id/apply-code', verifyToken, validate({ params: uuidParam, body: applyPromotionalCodeSchema }), applyPromotionalCode);

export default router;
