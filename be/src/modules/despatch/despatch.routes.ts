import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { uuidParam } from '../../lib/schemas';
import { createDespatchSchema, updateDespatchSchema } from './despatch.schema';
import { listDespatches, createDespatch, updateDespatch, deleteDespatch } from './despatch.controller';

const router = Router();

router.get('/',       listDespatches);
router.post('/',      validate({ body: createDespatchSchema }), createDespatch);
router.put('/:id',    validate({ params: uuidParam, body: updateDespatchSchema }), updateDespatch);
router.delete('/:id', validate({ params: uuidParam }), deleteDespatch);

export default router;
