import { z } from 'zod';

export const expenseSchema = z.object({
  category: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().positive(),
  date: z.string().optional(),
});
