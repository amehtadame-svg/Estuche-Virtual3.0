const CARACTERES_ESPECIALES = /[!@#$%^&*(),.?":{}|<>_\-+=[\]/;'`~]/;

export function validarPassword(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: 'La contraseña debe tener mínimo 8 caracteres.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'La contraseña debe tener al menos una letra mayúscula.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'La contraseña debe tener al menos una letra minúscula.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'La contraseña debe tener al menos un número.' };
  }
  if (!CARACTERES_ESPECIALES.test(password)) {
    return { valid: false, message: 'La contraseña debe tener al menos un carácter especial (ej: ! @ # $ % &).' };
  }
  return { valid: true };
}