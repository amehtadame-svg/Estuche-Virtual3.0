import { z } from 'zod';
import { validatePassword } from '../../utils/auth.utils';

const strongPassword = z.string().min(8).superRefine((value, ctx) => {
  const result = validatePassword(value);
  if (!result.valid) {
    ctx.addIssue({ code: 'custom', message: result.message ?? 'Contraseña inválida.' });
  }
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: strongPassword,
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  newPassword: strongPassword,
});