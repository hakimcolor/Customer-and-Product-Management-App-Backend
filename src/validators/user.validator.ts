import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(['ADMIN', 'MANAGER', 'ACCOUNTANT']).optional(),
  branchId: z.number().int().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'ACCOUNTANT']).optional(),
  branchId: z.number().int().nullable().optional(),
});
