import { z } from 'zod';

export const validRoles = ['superadmin', 'admin', 'employee', 'delivery', 'client'] as const;

export const createUserSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(validRoles).optional(),
});

export const editUserSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(validRoles).optional(),
});

export const updateProfileSchema = z.object({
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const updateRoleSchema = z.object({
  role: z.enum(validRoles),
});
