import { z } from 'zod';

export const loanSchema = z.object({
  creditor: z.string().min(1),
  amount: z.number().positive(),
  loanType: z.enum(['BORROW', 'LEND']),
  balance: z.number().nonnegative(),
  notes: z.string().optional(),
  date: z.string().optional(),
});

export const capitalSchema = z.object({
  ownerId: z.string().min(1),
  ownerName: z.string().min(1),
  percentage: z.number().min(0).max(100),
  amount: z.number().nonnegative(),
  date: z.string().optional(),
});
