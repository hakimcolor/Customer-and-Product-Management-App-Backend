import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';

// POS product search — optimized for barcode scanner + keyboard
export const searchProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { q, branchId, categoryId, brandId } = req.query;
    if (!q) {
      sendSuccess(res, []);
      return;
    }

    const search = String(q);
    const branch = branchId ? parseInt(String(branchId)) : undefined;

    const products = await prisma.product.findMany({
      where: {
        status: true,
        ...(categoryId && { categoryId: parseInt(String(categoryId)) }),
        ...(brandId && { brandId: parseInt(String(brandId)) }),
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { barcode: { equals: search } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      },
      include: {
        category: true,
        brand: true,
        unit: true,
        stocks: branch
          ? {
              where: { branchId: branch },
              select: { quantity: true, branchId: true },
            }
          : { select: { quantity: true, branchId: true } },
      },
      take: 20,
    });
    sendSuccess(res, products);
  } catch (err) {
    next(err);
  }
};

// Hold sale — store in DB as a held (draft) sale
export const holdSale = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { branchId, customerId, items, discount, notes } = req.body;
    const count = await prisma.sale.count();
    const invoiceNo = `HOLD-${String(count + 1).padStart(6, '0')}`;
    const totalAmount =
      items.reduce(
        (s: number, i: { rate: number; quantity: number; discount?: number }) =>
          s + i.rate * i.quantity - (i.discount || 0),
        0
      ) - (discount || 0);

    // Save as UNPAID sale with paymentStatus UNPAID — marks as held via notes
    const sale = await prisma.sale.create({
      data: {
        invoiceNo,
        branchId,
        customerId: customerId || null,
        totalAmount,
        discount: discount || 0,
        dueAmount: totalAmount,
        paymentStatus: 'UNPAID',
        notes: `[HELD] ${notes || ''}`,
        items: { create: items },
      },
      include: { items: { include: { product: true } }, customer: true },
    });
    sendSuccess(res, sale, 201);
  } catch (err) {
    next(err);
  }
};

// Get held sales
export const getHeldSales = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { branchId } = req.query;
    sendSuccess(
      res,
      await prisma.sale.findMany({
        where: {
          notes: { startsWith: '[HELD]' },
          ...(branchId && { branchId: parseInt(String(branchId)) }),
        },
        include: { customer: true, items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
      })
    );
  } catch (err) {
    next(err);
  }
};

// Quick POS checkout — create sale + deduct stock + update ledger in one transaction
export const posCheckout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      branchId,
      customerId,
      items,
      totalAmount,
      discount,
      vat,
      paidAmount,
      paymentType,
      notes,
    } = req.body;
    const dueAmount = Math.max(0, totalAmount - paidAmount);
    const paymentStatus =
      dueAmount <= 0 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'UNPAID';
    const count = await prisma.sale.count();
    const invoiceNo = `POS-${String(count + 1).padStart(6, '0')}`;

    const sale = await prisma.$transaction(async (tx) => {
      // Check stock
      for (const item of items) {
        const stock = await tx.stock.findFirst({
          where: { productId: item.productId, branchId, warehouseId: null },
        });
        if (!stock || stock.quantity < item.quantity) {
          throw new AppError(
            `Insufficient stock for product ID ${item.productId}`,
            400
          );
        }
      }
      const s = await tx.sale.create({
        data: {
          invoiceNo,
          customerId,
          branchId,
          totalAmount,
          discount: discount || 0,
          vat: vat || 0,
          dueAmount,
          paymentStatus,
          notes,
          items: { create: items },
        },
        include: { items: { include: { product: true } }, customer: true },
      });
      // Deduct stock
      for (const item of items) {
        const stock = await tx.stock.findFirst({
          where: { productId: item.productId, branchId, warehouseId: null },
        });
        if (stock)
          await tx.stock.update({
            where: { id: stock.id },
            data: { quantity: { decrement: item.quantity } },
          });
      }
      // Record payment
      if (paidAmount > 0) {
        await tx.payment.create({
          data: { saleId: s.id, customerId, amount: paidAmount, paymentType },
        });
      }
      // Update customer dues & ledger
      if (customerId && dueAmount > 0) {
        await tx.customer.update({
          where: { id: customerId },
          data: { dues: { increment: dueAmount } },
        });
        await tx.ledger.create({
          data: {
            customerId,
            type: 'DEBIT',
            amount: totalAmount,
            description: `POS Sale #${s.invoiceNo}`,
            refType: 'sale',
            refId: s.id,
          },
        });
      }
      return s;
    });
    sendSuccess(res, sale, 201);
  } catch (err) {
    next(err);
  }
};
