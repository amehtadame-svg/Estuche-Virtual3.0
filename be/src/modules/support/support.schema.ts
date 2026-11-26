import { z } from 'zod';
const body = z.string().trim().min(5, 'Escribe un mensaje de al menos 5 caracteres.').max(2000);
export const newThreadSchema = z.object({ subject: z.string().trim().min(3).max(150), body }).strict();
export const replySchema = z.object({ body }).strict();
