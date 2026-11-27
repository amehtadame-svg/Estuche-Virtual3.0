import { Router } from 'express';
import { verifyToken, verifyAdmin } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate';
import { z } from 'zod';
import { createProviderSchema, updateProviderSchema } from './provider.schema';
import { listProviders, createProvider, updateProvider, deleteProvider } from './provider.controller';

const router = Router();

// PostgreSQL puede almacenar identificadores con formato UUID que no cumplen
// los bits de versión/variante requeridos por z.string().uuid().
const providerIdParams = z.object({ id: z.guid() });

// Catálogo interno de proveedores: acceso exclusivo de administradores (C-01).
router.get('/',       verifyToken, verifyAdmin, listProviders);
router.post('/',      verifyToken, verifyAdmin, validate({ body: createProviderSchema }), createProvider);
router.put('/:id',    verifyToken, verifyAdmin, validate({ params: providerIdParams, body: updateProviderSchema }), updateProvider);
router.delete('/:id', verifyToken, verifyAdmin, validate({ params: providerIdParams }), deleteProvider);

export default router;
