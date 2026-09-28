import { z } from 'zod';

const saleItemSchema = z.object({
  productId: z.number().int(),
  quantity: z.number().int().positive(),
  rate: z.number().nonnegative(),
  discount: z.number().nonnegative().optional(),
});

export const createSaleSchema = z.object({
  customerId: z.number().int().optional(),
  branchId: z.number().int(),
  items: z.array(saleItemSchema).min(1),
  totalAmount: z.number().nonnegative(),
  discount: z.number().nonnegative().optional(),
  dueAmount: z.number().nonnegative().optional(),
  paymentStatus: z.enum(['PAID', 'PARTIAL', 'UNPAID']).optional(),
});

export const paymentSchema = z.object({
  amount: z.number().positive(),
  paymentType: z.enum(['CASH', 'CARD', 'MOBILE']).optional(),
});
