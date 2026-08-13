import { Router } from 'express';
import { login, register, requestToken, resetPassword, getMe} from './auth.controller';
import { verifyToken } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/request-token', requestToken);
router.post('/reset-password', resetPassword);
router.get('/me', verifyToken, getMe);

export default router;