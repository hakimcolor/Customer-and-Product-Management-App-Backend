import { z } from 'zod';

export const customerPaymentSchema = z.object({
  customerId: z.number().int().positive(),
  amount: z.number().positive(),
  paymentType: z.enum(['CASH', 'CARD', 'MOBILE']).default('CASH'),
  notes: z.string().optional(),
});

export const supplierPaymentSchema = z.object({
  supplierId: z.number().int().positive(),
  amount: z.number().positive(),
  paymentType: z.enum(['CASH', 'CARD', 'MOBILE']).default('CASH'),
  notes: z.string().optional(),
});
