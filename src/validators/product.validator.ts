import { z } from 'zod';

export const createProductSchema = z.object({
  title: z.string().min(1),
  brandId: z.number().int().optional(),
  categoryId: z.number().int().optional(),
  unitType: z.string().optional(),
  purchasePrice: z.number().nonnegative(),
  sellingPrice: z.number().nonnegative(),
  barcode: z.string().optional(),
  vat: z.number().nonnegative().optional(),
  alertQuantity: z.number().int().nonnegative().optional(),
});
