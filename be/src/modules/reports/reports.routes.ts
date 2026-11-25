import { Router } from 'express';
import { verifyToken, verifyAdmin, verifySuperAdmin } from '../../middlewares/auth.middleware';
import { listReports, getGeneralSummary, getAdminDashboard } from './reports.controller';

const router = Router();

// Resumen dinámico del panel administrativo (Admin y SuperAdmin)
router.get('/admin-dashboard', verifyToken, verifyAdmin, getAdminDashboard);

// Reportes financieros consolidados (SuperAdmin)
router.use(verifyToken, verifySuperAdmin);

router.get('/',        listReports);
router.get('/summary', getGeneralSummary);

export default router;