import { z } from 'zod';

/**
 * B-01: el formulario público de Contacto deja de ser una simulación.
 *
 * El mensaje se guarda como un PQR de tipo `petition` a nombre del cliente,
 * de modo que el equipo lo atiende con el mismo flujo y los mismos tiempos de
 * respuesta que el resto de solicitudes. Requiere sesión de cliente: si el
 * visitante no ha iniciado sesión, el frontend lo envía a /login.
 */
export const contactTopicValues = [
  'pedido',
  'producto',
  'envio',
  'devolucion',
  'otro',
] as const;

export const createContactMessageSchema = z
  .object({
    name: z.string().trim().min(2, 'Escribe tu nombre.').max(150),
    email: z.string().trim().toLowerCase().email('Ingresa un correo electrónico válido.').max(255),
    topic: z.enum(contactTopicValues).optional(),
    subject: z.string().trim().min(5, 'Escribe un asunto de al menos 5 caracteres.').max(160).optional(),
    message: z
      .string()
      .trim()
      .min(20, 'Describe tu solicitud con al menos 20 caracteres.')
      .max(5000),
  })
  .strict();

export type ContactMessageInput = z.infer<typeof createContactMessageSchema>;
