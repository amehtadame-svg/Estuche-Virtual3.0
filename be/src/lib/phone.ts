import { z } from 'zod';

// Números históricos locales o números nuevos con indicativo internacional.
export const phoneSchema = z.string().trim().refine(
  value => value === '' || /^\d{10}$/.test(value) || /^\+\d{1,3} \d{10}$/.test(value),
  'Escribe un indicativo de país y un número de 10 dígitos.',
);
