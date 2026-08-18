import { Router } from 'express';
import { verifyToken, verifySuperAdmin } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate';
import { uuidParam } from '../../lib/schemas';
import {
  createPromotionalCodeSchema,
  updatePromotionalCodeSchema,
  validatePromotionalCodeSchema,
  applyPromotionalCodeSchema,
} from './promotional-code.schema';
import {
  listPromotionalCodes,
  createPromotionalCode,
  updatePromotionalCode,
  togglePromotionalCode,
  deletePromotionalCode,
  validatePromotionalCode,
  applyPromotionalCode,
} from './promotional-code.controller';

const router = Router();

// Any authenticated user can validate/apply a code
router.post('/validate', verifyToken, validate({ body: validatePromotionalCodeSchema }), validatePromotionalCode);
router.post('/apply',    verifyToken, validate({ body: applyPromotionalCodeSchema }), applyPromotionalCode);

// Management restricted to superadmin
router.use(verifyToken, verifySuperAdmin);

router.get('/',             listPromotionalCodes);
router.post('/',            validate({ body: createPromotionalCodeSchema }), createPromotionalCode);
router.put('/:id',          validate({ params: uuidParam, body: updatePromotionalCodeSchema }), updatePromotionalCode);
router.patch('/:id/toggle', validate({ params: uuidParam }), togglePromotionalCode);
router.delete('/:id',       validate({ params: uuidParam }), deletePromotionalCode);

export default router;