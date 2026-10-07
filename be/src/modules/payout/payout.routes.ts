import { Router } from 'express';
import { verifyToken, verifySuperAdmin } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate';
import { uuidParam } from '../../lib/schemas';
import { createPayoutSchema, updatePayoutStatusSchema } from './payout.schema';
import { listPayouts, getPayout, createPayout, updatePayoutStatus } from './payout.controller';

const router = Router();

// Registrar el pago de un recibo propio lo hace el cliente durante el
// checkout: por eso va ANTES del bloque exclusivo de superadmin.
router.post('/',            verifyToken, validate({ body: createPayoutSchema }), createPayout);

// Consultar y conciliar pagos es tarea exclusiva del superadmin.
router.use(verifyToken, verifySuperAdmin);

router.get('/',             listPayouts);
router.get('/:id',          validate({ params: uuidParam }), getPayout);
router.patch('/:id/status', validate({ params: uuidParam, body: updatePayoutStatusSchema }), updatePayoutStatus);

export default router;
