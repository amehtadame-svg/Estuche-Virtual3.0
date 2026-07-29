import { Router } from 'express';
import { getPagos, getPagoById, actualizarEstadoPago } from '../controllers/pagos.controller';
import { verifyToken, verifySuperAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.use(verifyToken, verifySuperAdmin);

router.get('/',           getPagos);
router.get('/:id',        getPagoById);
router.patch('/:id/estado', actualizarEstadoPago);

export default router;