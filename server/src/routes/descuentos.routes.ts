import { Router } from 'express';
import { getDescuentos, crearDescuento, editarDescuento, toggleDescuento, eliminarDescuento } from '../controllers/descuentos.controller';
import { verifyToken, verifySuperAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.use(verifyToken, verifySuperAdmin);

router.get('/',              getDescuentos);
router.post('/',             crearDescuento);
router.put('/:id',           editarDescuento);
router.patch('/:id/toggle',  toggleDescuento);
router.delete('/:id',        eliminarDescuento);

export default router;