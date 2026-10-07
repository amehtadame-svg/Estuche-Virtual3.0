import { Router } from 'express';
import { verifyToken, verifyAdmin } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate';
import { uuidParam } from '../../lib/schemas';
import { createCategorySchema, updateCategorySchema } from './categories.schema';
import {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from './categories.controller';

const router = Router();

// Lectura pública: el catálogo y el formulario de productos necesitan la lista
// de categorías reales de la BD (no una lista fija en el frontend).
router.get('/',       listCategories);
router.get('/:id',    validate({ params: uuidParam }), getCategory);

// Escritura exclusiva de administradores (RF-014).
router.post('/',      verifyToken, verifyAdmin, validate({ body: createCategorySchema }), createCategory);
router.put('/:id',    verifyToken, verifyAdmin, validate({ params: uuidParam, body: updateCategorySchema }), updateCategory);
router.delete('/:id', verifyToken, verifyAdmin, validate({ params: uuidParam }), deleteCategory);

export default router;
