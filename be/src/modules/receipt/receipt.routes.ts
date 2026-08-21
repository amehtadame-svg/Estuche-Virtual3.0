import { Router } from 'express';
import { verifyToken, verifyAdmin } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate';
import { uuidParam } from '../../lib/schemas';
import { createReceiptSchema, updateReceiptSchema } from './receipt.schema';
import { listReceipts, createReceipt, updateReceipt, deleteReceipt } from './receipt.controller';

const router = Router();

// C-01: todas las rutas exigen sesión. POST y PUT los usa el cliente autenticado
// durante el checkout (crear recibo y marcarlo pagado), por eso solo piden token.
// Listar y eliminar recibos es exclusivo de administradores.
router.get('/',       verifyToken, verifyAdmin, listReceipts);
router.post('/',      verifyToken, validate({ body: createReceiptSchema }), createReceipt);
router.put('/:id',    verifyToken, validate({ params: uuidParam, body: updateReceiptSchema }), updateReceipt);
router.delete('/:id', verifyToken, verifyAdmin, validate({ params: uuidParam }), deleteReceipt);

export default router;
