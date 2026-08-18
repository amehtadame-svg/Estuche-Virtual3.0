import crypto from 'crypto';
import { TOKEN_EXP_MINUTES, generateCode } from '../utils/auth.utils';

interface StoredToken {
  hash: string;
  expiresAt: number;
  attempts: number;
  createdAt: number;
}

const tokens = new Map<string, StoredToken>();

const MAX_VERIFY_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;

const normalize = (email: string) => email.trim().toLowerCase();
const hash = (code: string) => crypto.createHash('sha256').update(code).digest('hex');

function safeEqual(a: string, b: string): boolean {
  const bufA = Uint8Array.from(Buffer.from(a, 'hex'));
  const bufB = Uint8Array.from(Buffer.from(b, 'hex'));
  // timingSafeEqual lanza si las longitudes difieren, así que se valida antes.
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export interface CreateResult {
  code: string;
  expiresInMinutes: number;
}

/** Devuelve los segundos que faltan para poder pedir otro código, o 0 si ya se puede. */
export function secondsUntilResend(email: string): number {
  const stored = tokens.get(normalize(email));
  if (!stored) return 0;
  const elapsed = Date.now() - stored.createdAt;
  if (elapsed >= RESEND_COOLDOWN_MS) return 0;
  return Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
}

/** Crea (o reemplaza) el código de recuperación de un correo. */
export function createResetCode(email: string): CreateResult {
  const code = generateCode();
  tokens.set(normalize(email), {
    hash: hash(code),
    expiresAt: Date.now() + TOKEN_EXP_MINUTES * 60 * 1000,
    attempts: 0,
    createdAt: Date.now(),
  });
  return { code, expiresInMinutes: TOKEN_EXP_MINUTES };
}

export interface VerifyResult {
  valid: boolean;
  reason?: string;
}

function check(email: string, code: string): { stored?: StoredToken; result: VerifyResult; key: string } {
  const key = normalize(email);
  const stored = tokens.get(key);

  if (!stored) {
    return { result: { valid: false, reason: 'No hay ningún código activo para este correo. Solicita uno nuevo.' }, key };
  }
  if (Date.now() > stored.expiresAt) {
    tokens.delete(key);
    return { result: { valid: false, reason: 'El código expiró. Solicita uno nuevo.' }, key };
  }
  if (stored.attempts >= MAX_VERIFY_ATTEMPTS) {
    tokens.delete(key);
    return { result: { valid: false, reason: 'Demasiados intentos fallidos. Solicita un código nuevo.' }, key };
  }
  if (!safeEqual(stored.hash, hash(code.trim()))) {
    stored.attempts += 1;
    const left = MAX_VERIFY_ATTEMPTS - stored.attempts;
    return {
      stored,
      key,
      result: {
        valid: false,
        reason: left > 0 ? `Código incorrecto. Te quedan ${left} intento(s).` : 'Código incorrecto. Solicita uno nuevo.',
      },
    };
  }
  return { stored, key, result: { valid: true } };
}

/** Verifica el código SIN gastarlo (paso 1 del formulario). */
export function verifyResetCode(email: string, code: string): VerifyResult {
  return check(email, code).result;
}

/** Verifica y elimina el código (paso 2: cambio de contraseña efectivo). */
export function consumeResetCode(email: string, code: string): VerifyResult {
  const { result, key } = check(email, code);
  if (result.valid) tokens.delete(key);
  return result;
}

/** Invalida cualquier código activo de un correo. */
export function clearResetCode(email: string): void {
  tokens.delete(normalize(email));
}

// Limpieza periódica de códigos vencidos.
const sweeper = setInterval(() => {
  const now = Date.now();
  for (const [email, data] of tokens.entries()) {
    if (now > data.expiresAt) tokens.delete(email);
  }
}, 5 * 60 * 1000);

// No mantener vivo el proceso solo por este timer.
if (typeof sweeper.unref === 'function') sweeper.unref();