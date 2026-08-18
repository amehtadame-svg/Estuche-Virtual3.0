import { Router } from 'express';
import {
  login,
  register,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  getMe,
} from './auth.controller';
import { verifyToken } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  verifyResetTokenSchema,
  resetPasswordSchema,
} from './auth.schema';

const router = Router();

router.post('/login', validate({ body: loginSchema }), login);
router.post('/register', validate({ body: registerSchema }), register);

// Recuperación de contraseña (3 pasos) 
router.post('/forgot-password', validate({ body: forgotPasswordSchema }), forgotPassword);
router.post('/verify-reset-token', validate({ body: verifyResetTokenSchema }), verifyResetToken);
router.post('/reset-password', validate({ body: resetPasswordSchema }), resetPassword);

router.get('/me', verifyToken, getMe);

export default router;
