import { z } from 'zod';
import { validatePassword } from '../../utils/auth.utils';

const strongPassword = z.string().min(8).superRefine((value, ctx) => {
  const result = validatePassword(value);
  if (!result.valid) {
    ctx.addIssue({ code: 'custom', message: result.message ?? 'Contraseña inválida.' });
  }
});

const email = z.string().trim().toLowerCase().email('Correo electrónico inválido.');

// Código de 6 dígitos enviado por correo.
const resetCode = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'El código debe tener 6 dígitos.');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'La contraseña es obligatoria.'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio.'),
  email,
  password: strongPassword,
});

/** Paso 1: pedir el código de recuperación al correo. */
export const forgotPasswordSchema = z.object({ email });

/** Paso 2: validar el código antes de mostrar el formulario de nueva contraseña. */
export const verifyResetTokenSchema = z.object({
  email,
  token: resetCode,
});

/** Paso 3: cambio efectivo de contraseña. */
export const resetPasswordSchema = z.object({
  email,
  token: resetCode,
  newPassword: strongPassword,
});