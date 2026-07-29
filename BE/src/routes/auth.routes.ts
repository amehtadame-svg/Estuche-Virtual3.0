import { Router } from 'express';
import { login, register, resetPassword, getMe} from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/reset-password', resetPassword);
router.get('/me', verifyToken, getMe);

export default router;