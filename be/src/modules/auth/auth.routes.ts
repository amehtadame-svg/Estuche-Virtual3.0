import { Router } from 'express';
import { verifyToken } from '../../middlewares/auth.middleware';
import { login, register, requestToken, verifyResetToken, resetPassword, getMe} from './auth.controller';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/request-token', requestToken);
router.post('/verify-token', verifyResetToken);  
router.post('/reset-password', resetPassword);
router.get('/me', verifyToken, getMe);

export default router;