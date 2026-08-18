// Maximum number of failed attempts before locking the account.
export const MAX_ATTEMPTS = 3;

// Validity (in minutes) of the password-recovery code.
export const TOKEN_EXP_MINUTES = 15;

// Generates a 6-digit numeric code (000000 - 999999) for password reset.
export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
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