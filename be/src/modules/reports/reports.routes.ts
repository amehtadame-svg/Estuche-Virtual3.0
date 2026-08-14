import { Router } from 'express';
import { verifyToken, verifySuperAdmin } from '../../middlewares/auth.middleware';
import { listReports, getGeneralSummary } from './reports.controller';

const router = Router();

router.use(verifyToken, verifySuperAdmin);

router.get('/',        listReports);
router.get('/summary', getGeneralSummary);

export default router;
