import { z } from 'zod';

export const loanSchema = z.object({
  creditor: z.string().min(1),
  amount: z.number().positive(),
  loanType: z.enum(['BORROW', 'LEND']),
  interestRate: z.number().min(0).optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

export const capitalSchema = z.object({
  ownerName: z.string().min(1),
  percentage: z.number().min(0).max(100).optional(),
  amount: z.number().positive(),
  notes: z.string().optional(),
});
