import { Router } from 'express';
import { verifyToken, verifyAdmin } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate';
import { z } from 'zod';
import { createProductSchema, updateProductSchema } from './products.schema';
import { listProducts, createProduct, updateProduct, deleteProduct } from './products.controller';

const router = Router();

// Acepta también identificadores existentes en PostgreSQL con formato UUID
// que no cumplen los bits de versión/variante exigidos por z.string().uuid().
const productIdParams = z.object({ id: z.guid() });

// GET / es público: lo consume el catálogo de la tienda sin sesión (RF-006).
// Las operaciones de escritura son exclusivas de administradores (C-01).
router.get('/',       listProducts);
router.post('/',      verifyToken, verifyAdmin, validate({ body: createProductSchema }), createProduct);
router.put('/:id',    verifyToken, verifyAdmin, validate({ params: productIdParams, body: updateProductSchema }), updateProduct);
router.delete('/:id', verifyToken, verifyAdmin, validate({ params: productIdParams }), deleteProduct);

export default router;
