import { Router } from 'express';
import { getDescuentos, aplicarDescuento, crearDescuento, editarDescuento, toggleDescuento, eliminarDescuento, validarDescuento } from '../controllers/descuentos.controller';
import { verifyToken, verifySuperAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Ruta pública para cualquier usuario autenticado (clientes incluidos)
router.post('/validar', verifyToken, validarDescuento);
router.post('/aplicar', verifyToken, aplicarDescuento);

// El resto queda solo para superadmin
router.use(verifyToken, verifySuperAdmin);

router.get('/',              getDescuentos);
router.post('/',             crearDescuento);
router.put('/:id',           editarDescuento);
router.patch('/:id/toggle',  toggleDescuento);
router.delete('/:id',        eliminarDescuento);

export default router;