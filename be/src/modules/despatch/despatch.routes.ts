import { Router } from 'express';
import { verifyToken, verifyAdmin } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate';
import { uuidParam } from '../../lib/schemas';
import { createDespatchSchema, updateDespatchSchema } from './despatch.schema';
import { listDespatches, createDespatch, updateDespatch, deleteDespatch } from './despatch.controller';

const router = Router();

// Gestión de envíos: acceso exclusivo de administradores (C-01).
router.get('/',       verifyToken, verifyAdmin, listDespatches);
router.post('/',      verifyToken, verifyAdmin, validate({ body: createDespatchSchema }), createDespatch);
router.put('/:id',    verifyToken, verifyAdmin, validate({ params: uuidParam, body: updateDespatchSchema }), updateDespatch);
router.delete('/:id', verifyToken, verifyAdmin, validate({ params: uuidParam }), deleteDespatch);

export default router;
