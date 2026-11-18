import { Router } from 'express';
import { verifyToken, verifyAdmin } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate';
import { createInboundSchema, createOutboundSchema } from './inventory.schema';
import {
  listMovements,
  registerInbound,
  registerOutbound,
  listOutboundReasons,
} from './inventory.controller';

const router = Router();

router.use(verifyToken, verifyAdmin);

router.get('/movements', listMovements);
router.post('/inbound', validate({ body: createInboundSchema }), registerInbound);

// HU-003 · Salida manual de productos
router.get('/outbound/reasons', listOutboundReasons);
router.post('/outbound', validate({ body: createOutboundSchema }), registerOutbound);

export default router;