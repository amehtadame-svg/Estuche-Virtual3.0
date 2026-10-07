import { Router } from 'express';
import { verifyToken, verifyAdmin, verifySuperAdmin } from '../../middlewares/auth.middleware';
import { listReports, getGeneralSummary } from './reports.controller';

const router = Router();

router.use(verifyToken);

// El resumen lo consumen los paneles de administración (admin y superadmin).
router.get('/summary', verifyAdmin, getGeneralSummary);

// El histórico de reportes generados queda reservado al superadmin.
router.get('/', verifySuperAdmin, listReports);

export default router;
