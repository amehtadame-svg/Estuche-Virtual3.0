import { Router } from 'express';
import { verifyToken, verifyAdmin } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate';
import { uuidParam } from '../../lib/schemas';
import { createComboSchema, updateComboSchema } from './combos.schema';
import { createCombo, listCombos, updateCombo, deleteCombo } from './combos.controller';

const router = Router();

router.post('/', verifyToken, verifyAdmin, validate({ body: createComboSchema }), createCombo);
router.get('/', verifyToken, verifyAdmin, listCombos);
router.put('/:id', verifyToken, verifyAdmin, validate({ params: uuidParam, body: updateComboSchema }), updateCombo);
router.delete('/:id', verifyToken, verifyAdmin, validate({ params: uuidParam }), deleteCombo);

export default router;