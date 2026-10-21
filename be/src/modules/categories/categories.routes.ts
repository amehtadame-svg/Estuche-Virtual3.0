import { Router } from 'express';
import { verifyToken, verifyAdmin } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate';
import { uuidParam } from '../../lib/schemas';
import { createCategorySchema, updateCategorySchema } from './categories.schema';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from './categories.controller';

const router = Router();

// GET / es público para el catálogo y filtros
router.get('/', listCategories);
router.post('/', verifyToken, verifyAdmin, validate({ body: createCategorySchema }), createCategory);
router.put('/:id', verifyToken, verifyAdmin, validate({ params: uuidParam, body: updateCategorySchema }), updateCategory);
router.delete('/:id', verifyToken, verifyAdmin, validate({ params: uuidParam }), deleteCategory);

export default router;