import { z } from 'zod';

// Admite identificadores con formato UUID existentes en PostgreSQL, incluidos
// los que no tienen los bits de versión/variante exigidos por z.string().uuid().
// Esto valida el formato; las rutas y servicios conservan sus permisos y controles.
export const uuidParam = z.object({
  id: z.guid(),
});

export const uuidProductParam = z.object({
  productId: z.string().uuid(),
});
