import { z } from 'zod';

const purchaseItemSchema = z.object({
  productId: z.number().int(),
  quantity: z.number().int().positive(),
  rate: z.number().nonnegative(),
  discount: z.number().nonnegative().optional(),
});

export const createPurchaseSchema = z.object({
  supplierId: z.number().int(),
  branchId: z.number().int(),
  items: z.array(purchaseItemSchema).min(1),
  totalAmount: z.number().nonnegative(),
  dueAmount: z.number().nonnegative().optional(),
  paymentStatus: z.enum(['PAID', 'PARTIAL', 'UNPAID']).optional(),
});

export const paymentSchema = z.object({
  amount: z.number().positive(),
  paymentType: z.enum(['CASH', 'CARD', 'MOBILE']).optional(),
});
