import { prisma } from './prisma';

/**
 * CONFIG / STARTUP
 * ----------------
 * Validación de la configuración ANTES de arrancar el servidor:
 *  - DATABASE_URL y JWT_SECRET son obligatorias y con forma válida.
 *  - La conexión a la base de datos se verifica con un ping real.
 *
 * Si algo falta, el proceso termina con un mensaje claro en lugar de
 * arrancar a medias (C: "validar configuración y conexión a BD al iniciar").
 */

export interface StartupConfig {
  databaseUrl: string;
  jwtSecret: string;
  port: number;
  corsOrigins: string[];
  nodeEnv: string;
}

export class ConfigError extends Error {}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): StartupConfig {
  const problems: string[] = [];

  const databaseUrl = env.DATABASE_URL?.trim() ?? '';
  if (!databaseUrl) {
    problems.push(
      'Falta DATABASE_URL. Copia be/.env-example a be/.env (o define el Codespaces secret equivalente).',
    );
  } else if (!/^postgres(ql)?:\/\//.test(databaseUrl)) {
    problems.push('DATABASE_URL debe empezar por postgresql:// o postgres://.');
  }

  const jwtSecret = env.JWT_SECRET?.trim() ?? '';
  if (!jwtSecret) {
    problems.push('Falta JWT_SECRET. Genera uno con: openssl rand -base64 32');
  } else if (jwtSecret.length < 32) {
    problems.push(
      `JWT_SECRET demasiado corto (${jwtSecret.length} caracteres); usa al menos 32.`,
    );
  }

  const port = Number(env.PORT ?? 4000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    problems.push(`PORT inválido: ${env.PORT}. Debe ser un número entre 1 y 65535.`);
  }

  const corsOrigins = (env.CORS_ORIGINS ?? 'http://localhost:5173,https://*.app.github.dev')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (corsOrigins.length === 0) {
    problems.push('CORS_ORIGINS no puede quedar vacío.');
  }

  if (problems.length > 0) {
    throw new ConfigError(
      'Configuración inválida:\n' + problems.map((p) => `  - ${p}`).join('\n'),
    );
  }

  return {
    databaseUrl,
    jwtSecret,
    port,
    corsOrigins,
    nodeEnv: env.NODE_ENV ?? 'development',
  };
}

/** Ping real a la BD con reintentos. Lanza si nunca conecta. */
export async function checkDatabase(retries = 5, delayMs = 2000): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        console.warn(
          `[startup] Conexión a BD fallida (intento ${attempt}/${retries}). Reintentando en ${delayMs} ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw new ConfigError(
    'No se pudo conectar a la base de datos tras ' +
      `${retries} intentos. Revisa DATABASE_URL y que el servidor esté disponible.\n` +
      `Detalle: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}
