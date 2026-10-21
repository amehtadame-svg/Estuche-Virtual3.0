import { Router } from 'express';
import { verifyToken, verifyAdmin } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate';
import { createInboundSchema } from './inventory.schema';
import { listMovements, registerInbound } from './inventory.controller';

const router = Router();

router.use(verifyToken, verifyAdmin);

router.get('/movements', listMovements);
router.post('/inbound', validate({ body: createInboundSchema }), registerInbound);

export default router;