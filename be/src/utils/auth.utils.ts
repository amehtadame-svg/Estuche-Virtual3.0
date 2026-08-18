export const MAX_ATTEMPTS = Number(process.env.LOGIN_MAX_ATTEMPTS ?? 3);

// How long (in minutes) the account stays locked after too many failed logins.
export const LOCK_MINUTES = Number(process.env.LOGIN_LOCK_MINUTES ?? 15);

// Validity (in minutes) of the password-recovery code.
export const TOKEN_EXP_MINUTES = Number(process.env.RESET_TOKEN_MINUTES ?? 15);

// Generates a 6-digit numeric code (100000 - 999999) for password reset.
import crypto from 'crypto';

export function generateCode(): string {
  return String(crypto.randomInt(100000, 1000000));
}

export interface PasswordCheck {
  valid: boolean;
  message?: string;
}

// Minimum 8 characters, uppercase, lowercase, number and special character.
export function validatePassword(password: string): PasswordCheck {
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
