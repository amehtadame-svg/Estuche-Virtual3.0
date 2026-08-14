import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { uuidParam } from '../../lib/schemas';
import { createReceiptSchema, updateReceiptSchema } from './receipt.schema';
import { listReceipts, createReceipt, updateReceipt, deleteReceipt } from './receipt.controller';

const router = Router();

router.get('/',       listReceipts);
router.post('/',      validate({ body: createReceiptSchema }), createReceipt);
router.put('/:id',    validate({ params: uuidParam, body: updateReceiptSchema }), updateReceipt);
router.delete('/:id', validate({ params: uuidParam }), deleteReceipt);

export default router;
