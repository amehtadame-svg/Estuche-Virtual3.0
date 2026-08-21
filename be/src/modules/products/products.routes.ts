import { Router } from 'express';
import { verifyToken, verifyAdmin } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate';
import { uuidParam } from '../../lib/schemas';
import { createProductSchema, updateProductSchema } from './products.schema';
import { listProducts, createProduct, updateProduct, deleteProduct } from './products.controller';

const router = Router();

// GET / es público: lo consume el catálogo de la tienda sin sesión (RF-006).
// Las operaciones de escritura son exclusivas de administradores (C-01).
router.get('/',       listProducts);
router.post('/',      verifyToken, verifyAdmin, validate({ body: createProductSchema }), createProduct);
router.put('/:id',    verifyToken, verifyAdmin, validate({ params: uuidParam, body: updateProductSchema }), updateProduct);
router.delete('/:id', verifyToken, verifyAdmin, validate({ params: uuidParam }), deleteProduct);

export default router;
