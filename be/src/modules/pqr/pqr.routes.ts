import { Router } from 'express';
import { verifyAdmin, verifyToken } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate';
import { uuidParam } from '../../lib/schemas';
import { createPqrSchema, updatePqrSchema } from './pqr.schema';
import {
  createPqr,
  getPqr,
  listPqr,
  updatePqr,
} from './pqr.controller';

const router = Router();

router.use(verifyToken);

router.get('/', listPqr);
router.get('/:id', validate({ params: uuidParam }), getPqr);
router.post('/', validate({ body: createPqrSchema }), createPqr);
router.patch(
  '/:id',
  verifyAdmin,
  validate({ params: uuidParam, body: updatePqrSchema }),
  updatePqr,
);

export default router;