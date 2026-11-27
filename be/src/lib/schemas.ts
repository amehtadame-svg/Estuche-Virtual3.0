import { z } from 'zod';

// PostgreSQL admite UUID de 128 bits aunque no tengan versión/variante RFC.
// Hay IDs históricos de ese tipo: conservarlos sin aceptar texto arbitrario.
// z.guid exige los 32 dígitos hexadecimales con el formato 8-4-4-4-12.
export const databaseUuidSchema = z.guid('El identificador no tiene un formato UUID válido.').toLowerCase();

export const uuidParam = z.object({
  id: databaseUuidSchema,
});

export const uuidProductParam = z.object({
  productId: databaseUuidSchema,
});
