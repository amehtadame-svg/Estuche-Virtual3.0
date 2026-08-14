interface TokenGuardado {
  token: string;
  expira_en: number; // fecha de vencimiento, en milisegundos
}

const tokens = new Map<string, TokenGuardado>();

const DURACION_MINUTOS = 15;

export function crearToken(email: string): string {
  const token = Math.floor(100000 + Math.random() * 900000).toString();
  tokens.set(email, {
    token,
    expira_en: Date.now() + DURACION_MINUTOS * 60 * 1000,
  });
  return token;
}

export function verificarYConsumirToken(
  email: string,
  token: string
): { valido: boolean; motivo?: string } {
  const guardado = tokens.get(email);

  if (!guardado) {
    return { valido: false, motivo: 'No hay ningún código activo para este correo.' };
  }
  if (guardado.token !== token) {
    return { valido: false, motivo: 'Código incorrecto.' };
  }
  if (Date.now() > guardado.expira_en) {
    tokens.delete(email);
    return { valido: false, motivo: 'El código expiró, solicita uno nuevo.' };
  }

  tokens.delete(email);
  return { valido: true };
}

export function verificarToken(
  email: string,
  token: string
): { valido: boolean; motivo?: string } {
  const guardado = tokens.get(email);

  if (!guardado) {
    return { valido: false, motivo: 'No hay ningún código activo para este correo.' };
  }
  if (guardado.token !== token) {
    return { valido: false, motivo: 'Código incorrecto.' };
  }
  if (Date.now() > guardado.expira_en) {
    tokens.delete(email);
    return { valido: false, motivo: 'El código expiró, solicita uno nuevo.' };
  }

  return { valido: true };
}

setInterval(() => {
  const ahora = Date.now();
  for (const [email, data] of tokens.entries()) {
    if (ahora > data.expira_en) tokens.delete(email);
  }
}, 5 * 60 * 1000);