import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';
import { getPagination, paginate } from '../../utils/pagination';

export const getPurchases = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { supplierId, branchId, startDate, endDate, paymentStatus } = req.query;
    const { skip, take, page, limit } = getPagination(req);
    const where = {
      ...(supplierId && { supplierId: parseInt(String(supplierId)) }),
      ...(branchId && { branchId: parseInt(String(branchId)) }),
      ...(paymentStatus && { paymentStatus: String(paymentStatus) as any }),
      ...(startDate && endDate && { date: { gte: new Date(String(startDate)), lte: new Date(String(endDate)) } }),
    };
    const [data, total] = await Promise.all([
      prisma.purchase.findMany({
        where, skip, take, orderBy: { date: 'desc' },
        include: { supplier: true, branch: true, items: { include: { product: true } } },
      }),
      prisma.purchase.count({ where }),
    ]);
    sendSuccess(res, paginate(data, total, page, limit));
  } catch (err) { next(err); }
};

export const createPurchase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { supplierId, branchId, items, totalAmount, dueAmount, paymentStatus } = req.body;
    const purchase = await prisma.$transaction(async (tx) => {
      const p = await tx.purchase.create({
        data: { supplierId, branchId, totalAmount, dueAmount, paymentStatus, items: { create: items } },
        include: { items: { include: { product: true } }, supplier: true },
      });
      // Update stock for each item
      for (const item of items) {
        await tx.stock.upsert({
          where: { productId_branchId: { productId: item.productId, branchId } },
          update: { quantity: { increment: item.quantity } },
          create: { productId: item.productId, branchId, quantity: item.quantity, openingStock: 0, onStock: item.quantity },
        });
      }
      // Update supplier dues
      if (dueAmount > 0) {
        await tx.supplier.update({ where: { id: supplierId }, data: { dues: { increment: dueAmount } } });
        await tx.ledger.create({ data: { supplierId, type: 'DEBIT', amount: totalAmount, notes: `Purchase #${p.id}` } });
      }
      return p;
    });
    sendSuccess(res, purchase, 201);
  } catch (err) { next(err); }
};

export const getPurchase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const p = await prisma.purchase.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { supplier: true, branch: true, items: { include: { product: true } }, payments: true },
    });
    if (!p) throw new AppError('Purchase not found', 404);
    sendSuccess(res, p);
  } catch (err) { next(err); }
};

export const makePurchasePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const purchaseId = parseInt(req.params.id);
    const { amount, paymentType, notes } = req.body;
    const purchase = await prisma.purchase.findUnique({ where: { id: purchaseId } });
    if (!purchase) throw new AppError('Purchase not found', 404);
    if (amount > purchase.dueAmount) throw new AppError('Payment exceeds due amount', 400);

    const newDue = purchase.dueAmount - amount;
    await prisma.$transaction([
      prisma.payment.create({ data: { purchaseId, supplierId: purchase.supplierId, amount, paymentType, notes } }),
      prisma.purchase.update({
        where: { id: purchaseId },
        data: { dueAmount: newDue, paymentStatus: newDue <= 0 ? 'PAID' : 'PARTIAL' },
      }),
      prisma.supplier.update({ where: { id: purchase.supplierId }, data: { dues: { decrement: amount } } }),
      prisma.ledger.create({ data: { supplierId: purchase.supplierId, type: 'CREDIT', amount, notes: `Payment for Purchase #${purchaseId}` } }),
    ]);
    sendSuccess(res, { message: 'Payment recorded', remainingDue: newDue });
  } catch (err) { next(err); }
};

export const returnPurchase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const purchaseId = parseInt(req.params.id);
    const { items } = req.body;
    const purchase = await prisma.purchase.findUnique({ where: { id: purchaseId }, include: { items: true } });
    if (!purchase) throw new AppError('Purchase not found', 404);

    await prisma.$transaction(async (tx) => {
      for (const ret of items) {
        const pItem = purchase.items.find(i => i.id === ret.purchaseItemId);
        if (!pItem) throw new AppError(`Item ${ret.purchaseItemId} not found`, 404);
        if (ret.quantity > pItem.quantity) throw new AppError(`Return quantity exceeds purchased quantity`, 400);

        await tx.stock.update({
          where: { productId_branchId: { productId: pItem.productId, branchId: purchase.branchId } },
          data: { quantity: { decrement: ret.quantity } },
        });
        if (ret.quantity === pItem.quantity) {
          await tx.purchaseItem.delete({ where: { id: pItem.id } });
        } else {
          await tx.purchaseItem.update({ where: { id: pItem.id }, data: { quantity: { decrement: ret.quantity } } });
        }
      }
      const remaining = await tx.purchaseItem.findMany({ where: { purchaseId } });
      const newTotal = remaining.reduce((sum, i) => sum + i.rate * i.quantity - i.discount, 0);
      await tx.purchase.update({ where: { id: purchaseId }, data: { totalAmount: newTotal } });
    });
    sendSuccess(res, { message: 'Purchase return processed' });
  } catch (err) { next(err); }
};
