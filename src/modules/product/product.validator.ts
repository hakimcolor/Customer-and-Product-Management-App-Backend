import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(1),
});

export const brandSchema = z.object({
  name: z.string().min(1),
});

export const productSchema = z.object({
  title: z.string().min(1),
  brandId: z.number().int().positive().optional(),
  categoryId: z.number().int().positive().optional(),
  unitType: z.string().optional(),
  purchasePrice: z.number().nonnegative(),
  sellingPrice: z.number().nonnegative(),
  barcode: z.string().optional(),
  vat: z.number().nonnegative().default(0),
  alertQuantity: z.number().int().nonnegative().default(5),
});

export const openingStockSchema = z.object({
  productId: z.number().int().positive(),
  branchId: z.number().int().positive(),
  quantity: z.number().int().nonnegative(),
});

export const stockTransferSchema = z.object({
  fromBranchId: z.number().int().positive(),
  toBranchId: z.number().int().positive(),
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

export const damageSchema = z.object({
  productId: z.number().int().positive(),
  branchId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  reason: z.string().optional(),
});
