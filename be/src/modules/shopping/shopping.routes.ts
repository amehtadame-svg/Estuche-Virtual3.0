import { Router } from 'express';
import { verifyToken } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate';
import { uuidProductParam } from '../../lib/schemas';
import { addItemSchema, updateQuantitySchema } from './shopping.schema';
import { getShopping, addItem, updateQuantity, removeItem, clearShopping } from './shopping.controller';

const router = Router();

router.use(verifyToken); // todas las rutas del carrito requieren login
router.use((req, res, next) => {
  const role = (req as any).user.role;
  if (role === 'employee' || role === 'delivery') return res.status(403).json({ message: 'El carrito no está disponible para este rol.' });
  next();
});

router.get('/',              getShopping);
router.post('/',             validate({ body: addItemSchema }), addItem);
router.delete('/clear',      clearShopping);
router.put('/:productId',    validate({ params: uuidProductParam, body: updateQuantitySchema }), updateQuantity);
router.delete('/:productId', validate({ params: uuidProductParam }), removeItem);

export default router;
