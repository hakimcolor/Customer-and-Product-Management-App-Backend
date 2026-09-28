import { z } from 'zod';

const purchaseItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  rate: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
});

export const createPurchaseSchema = z.object({
  supplierId: z.number().int().positive(),
  branchId: z.number().int().positive(),
  items: z.array(purchaseItemSchema).min(1, 'At least one item required'),
  totalAmount: z.number().nonnegative(),
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
    purchaseItemId: z.number().int().positive(),
    quantity: z.number().int().positive(),
  })).min(1),
});
