import { z } from 'zod';

export const PedidosSchema = z.object({
  id_direccion: z.number().optional(),
  total: z.number().min(0),
  id_descuento: z.number().optional(), 
  estado: z.string().optional(),
  detalles: z.array(z.object({
    id_producto: z.number(),
    cantidad: z.number().min(1),
    precio: z.number().min(0),
  })).optional(),
});
