import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { verifyAdmin, verifyToken } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate';
import { uuidParam } from '../../lib/schemas';
import { createPqrSchema, updatePqrSchema } from './pqr.schema';
import { createContactMessageSchema } from './contact.schema';
import {
  createContactMessage,
  createPqr,
  getPqr,
  listPqr,
  updatePqr,
} from './pqr.controller';

const router = Router();

router.use(verifyToken);

router.get('/', listPqr);
router.get('/:id', validate({ params: uuidParam }), getPqr);
router.post('/', validate({ body: createPqrSchema }), createPqr);

// B-01: formulario público de Contacto → PQR de tipo petición.
router.post(
  '/contact',
  rateLimit({ windowMs: 60000, limit: 10, standardHeaders: true, legacyHeaders: false }),
  validate({ body: createContactMessageSchema }),
  createContactMessage,
);
router.patch(
  '/:id',
  verifyAdmin,
  validate({ params: uuidParam, body: updatePqrSchema }),
  updatePqr,
);

export default router;