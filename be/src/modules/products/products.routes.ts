import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { uuidParam } from '../../lib/schemas';
import { createProductSchema, updateProductSchema } from './products.schema';
import { listProducts, createProduct, updateProduct, deleteProduct } from './products.controller';

const router = Router();

router.get('/',       listProducts);
router.post('/',      validate({ body: createProductSchema }), createProduct);
router.put('/:id',    validate({ params: uuidParam, body: updateProductSchema }), updateProduct);
router.delete('/:id', validate({ params: uuidParam }), deleteProduct);

export default router;
