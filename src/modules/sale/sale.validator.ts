import { z } from 'zod';

const saleItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  rate: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
});

export const createSaleSchema = z.object({
  customerId: z.number().int().positive().optional(),
  branchId: z.number().int().positive(),
  items: z.array(saleItemSchema).min(1, 'At least one item required'),
  totalAmount: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
  dueAmount: z.number().nonnegative().default(0),
  paymentStatus: z.enum(['PAID', 'PARTIAL', 'UNPAID']).default('UNPAID'),
});

export const paymentSchema = z.object({
  amount: z.number().positive(),
  paymentType: z.enum(['CASH', 'CARD', 'MOBILE']).default('CASH'),
  notes: z.string().optional(),
});

export const returnSchema = z.object({
  items: z.array(z.object({
    saleItemId: z.number().int().positive(),
    quantity: z.number().int().positive(),
  })).min(1),
});
