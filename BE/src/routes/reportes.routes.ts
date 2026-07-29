import { Router } from 'express';
import { getReportes, getResumenGeneral } from '../controllers/reportes.controller';
import { verifyToken, verifySuperAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.use(verifyToken, verifySuperAdmin);

router.get('/',       getReportes);
router.get('/resumen', getResumenGeneral);

export default router;