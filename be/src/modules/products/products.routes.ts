import { Router } from 'express';
import { verifyToken, verifyAdmin } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate';
import { uuidParam } from '../../lib/schemas';
import { createProductSchema, updateProductSchema, adjustStockSchema } from './products.schema';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  adjustStock,
  deleteProduct,
} from './products.controller';

const router = Router();

// GET / es público: lo consume el catálogo de la tienda sin sesión (RF-006).
// Las operaciones de escritura son exclusivas de administradores (C-01).
router.get('/',            listProducts);
router.get('/:id',         validate({ params: uuidParam }), getProduct);
router.post('/',           verifyToken, verifyAdmin, validate({ body: createProductSchema }), createProduct);
router.put('/:id',         verifyToken, verifyAdmin, validate({ params: uuidParam, body: updateProductSchema }), updateProduct);
router.patch('/:id/stock', verifyToken, verifyAdmin, validate({ params: uuidParam, body: adjustStockSchema }), adjustStock);
router.delete('/:id',      verifyToken, verifyAdmin, validate({ params: uuidParam }), deleteProduct);

export default router;
