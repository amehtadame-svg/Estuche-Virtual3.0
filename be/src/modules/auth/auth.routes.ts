import { Router } from 'express';
import { login, register, resetPassword, getMe } from './auth.controller';
import { verifyToken } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate';
import { loginSchema, registerSchema, resetPasswordSchema } from './auth.schema';

const router = Router();

router.post('/login', validate({ body: loginSchema }), login);
router.post('/register', validate({ body: registerSchema }), register);
router.post('/reset-password', validate({ body: resetPasswordSchema }), resetPassword);
router.get('/me', verifyToken, getMe);

export default router;
