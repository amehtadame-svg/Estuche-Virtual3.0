import { Router } from 'express';
import { verifyToken, verifySuperAdmin } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate';
import { uuidParam } from '../../lib/schemas';
import { resolveReturnSchema } from './returns.schema';
import { listReturns, getReturn, resolveReturn } from './returns.controller';

const router = Router();

router.use(verifyToken, verifySuperAdmin);

router.get('/',               listReturns);
router.get('/:id',            validate({ params: uuidParam }), getReturn);
router.patch('/:id/resolve',  validate({ params: uuidParam, body: resolveReturnSchema }), resolveReturn);

export default router;
