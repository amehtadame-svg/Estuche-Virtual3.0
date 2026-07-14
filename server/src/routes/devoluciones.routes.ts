import { Router } from 'express';
import { getDevoluciones, getDevolucionById, resolverDevolucion } from '../controllers/devoluciones.controller';
import { verifyToken, verifySuperAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.use(verifyToken, verifySuperAdmin);

router.get('/',              getDevoluciones);
router.get('/:id',           getDevolucionById);
router.patch('/:id/resolver', resolverDevolucion);

export default router;