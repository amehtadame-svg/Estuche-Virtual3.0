import { Router } from 'express';
import { verifyToken, verifyAdmin } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate';
import { uuidParam } from '../../lib/schemas';
import {
  createReceiptSchema,
  updateReceiptSchema,
} from './receipt.schema';
import {
  listReceipts,
  createReceipt,
  updateReceipt,
  deleteReceipt,
} from './receipt.controller';

const router = Router();

router.use(verifyToken);

router.get(
  '/',
  verifyAdmin,
  listReceipts
);

router.post(
  '/',
  validate({ body: createReceiptSchema }),
  createReceipt
);

router.put(
  '/:id',
  verifyAdmin,
  validate({ params: uuidParam, body: updateReceiptSchema }),
  updateReceipt
);

router.delete(
  '/:id',
  verifyAdmin,
  validate({ params: uuidParam }),
  deleteReceipt
);

export default router;