import { Router } from 'express';
import { verifyToken, verifySuperAdmin } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate';
import { uuidParam } from '../../lib/schemas';
import { updatePayoutStatusSchema } from './payout.schema';
import { listPayouts, getPayout, updatePayoutStatus } from './payout.controller';

const router = Router();

router.use(verifyToken, verifySuperAdmin);

router.get('/',             listPayouts);
router.get('/:id',          validate({ params: uuidParam }), getPayout);
router.patch('/:id/status', validate({ params: uuidParam, body: updatePayoutStatusSchema }), updatePayoutStatus);

export default router;
