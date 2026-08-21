import { Router } from 'express';
import { verifyToken, verifyAdmin } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate';
import { uuidParam } from '../../lib/schemas';
import { createProviderSchema, updateProviderSchema } from './provider.schema';
import { listProviders, createProvider, updateProvider, deleteProvider } from './provider.controller';

const router = Router();

// Catálogo interno de proveedores: acceso exclusivo de administradores (C-01).
router.get('/',       verifyToken, verifyAdmin, listProviders);
router.post('/',      verifyToken, verifyAdmin, validate({ body: createProviderSchema }), createProvider);
router.put('/:id',    verifyToken, verifyAdmin, validate({ params: uuidParam, body: updateProviderSchema }), updateProvider);
router.delete('/:id', verifyToken, verifyAdmin, validate({ params: uuidParam }), deleteProvider);

export default router;
