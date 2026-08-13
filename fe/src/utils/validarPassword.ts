export interface PasswordCheck {
  valid: boolean;
  message?: string;
}

export function validarPassword(password: string): PasswordCheck {
  if (password.length < 8) {
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