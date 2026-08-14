import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { uuidParam } from '../../lib/schemas';
import { createProviderSchema, updateProviderSchema } from './provider.schema';
import { listProviders, createProvider, updateProvider, deleteProvider } from './provider.controller';

const router = Router();

router.get('/',       listProviders);
router.post('/',      validate({ body: createProviderSchema }), createProvider);
router.put('/:id',    validate({ params: uuidParam, body: updateProviderSchema }), updateProvider);
router.delete('/:id', validate({ params: uuidParam }), deleteProvider);

export default router;
