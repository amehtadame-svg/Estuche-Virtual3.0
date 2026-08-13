// Número máximo de intentos fallidos antes de bloquear la cuenta.
export const MAX_INTENTOS = 3;

// Minutos de validez del código de recuperación de contraseña.
export const TOKEN_EXP_MINUTOS = 15;

// Genera un código numérico de 6 dígitos (000000 - 999999) para reset de contraseña.
export function generarCodigo(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export interface PasswordCheck {
  valid: boolean;
  message?: string;
}

// mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial.
export function validarPassword(password: string): PasswordCheck {
  if (!password || password.length < 8) {
    return { valid: false, message: 'La contraseña debe tener al menos 8 caracteres.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'La contraseña debe incluir al menos una letra mayúscula.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'La contraseña debe incluir al menos una letra minúscula.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'La contraseña debe incluir al menos un número.' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/~`;']/.test(password)) {
    return { valid: false, message: 'La contraseña debe incluir al menos un carácter especial (!@#$%...).' };
  }
  return { valid: true };
}