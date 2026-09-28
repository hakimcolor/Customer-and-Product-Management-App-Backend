import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';
import { getPagination, paginate } from '../../utils/pagination';

export const getSales = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { customerId, branchId, startDate, endDate, paymentStatus } = req.query;
    const { skip, take, page, limit } = getPagination(req);
    const where = {
      ...(customerId && { customerId: parseInt(String(customerId)) }),
      ...(branchId && { branchId: parseInt(String(branchId)) }),
      ...(paymentStatus && { paymentStatus: String(paymentStatus) as any }),
      ...(startDate && endDate && { date: { gte: new Date(String(startDate)), lte: new Date(String(endDate)) } }),
    };
    const [data, total] = await Promise.all([
      prisma.sale.findMany({
        where, skip, take, orderBy: { date: 'desc' },
        include: { customer: true, branch: true, items: { include: { product: true } } },
      }),
      prisma.sale.count({ where }),
    ]);
    sendSuccess(res, paginate(data, total, page, limit));
  } catch (err) { next(err); }
};

export const createSale = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { customerId, branchId, items, totalAmount, discount, dueAmount, paymentStatus } = req.body;

    const sale = await prisma.$transaction(async (tx) => {
      // Check stock availability
      for (const item of items) {
        const stock = await tx.stock.findUnique({
          where: { productId_branchId: { productId: item.productId, branchId } },
        });
        if (!stock || stock.quantity < item.quantity) {
          throw new AppError(`Insufficient stock for product ID ${item.productId}`, 400);
        }
      }
      const s = await tx.sale.create({
        data: { customerId, branchId, totalAmount, discount, dueAmount, paymentStatus, items: { create: items } },
        include: { items: { include: { product: true } }, customer: true },
      });
      // Deduct stock
      for (const item of items) {
        await tx.stock.update({
          where: { productId_branchId: { productId: item.productId, branchId } },
          data: { quantity: { decrement: item.quantity } },
        });
      }
      // Update customer dues
      if (customerId && dueAmount > 0) {
        await tx.customer.update({ where: { id: customerId }, data: { dues: { increment: dueAmount } } });
        await tx.ledger.create({ data: { customerId, type: 'DEBIT', amount: totalAmount, notes: `Sale #${s.id}` } });
      }
      return s;
    });
    sendSuccess(res, sale, 201);
  } catch (err) { next(err); }
};

export const getSale = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const s = await prisma.sale.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { customer: true, branch: true, items: { include: { product: true } }, payments: true },
    });
    if (!s) throw new AppError('Sale not found', 404);
    sendSuccess(res, s);
  } catch (err) { next(err); }
};

export const makeSalePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const saleId = parseInt(req.params.id);
    const { amount, paymentType, notes } = req.body;
    const sale = await prisma.sale.findUnique({ where: { id: saleId } });
    if (!sale) throw new AppError('Sale not found', 404);
    if (amount > sale.dueAmount) throw new AppError('Payment exceeds due amount', 400);

    const newDue = sale.dueAmount - amount;
    await prisma.$transaction([
      prisma.payment.create({ data: { saleId, customerId: sale.customerId, amount, paymentType, notes } }),
      prisma.sale.update({
        where: { id: saleId },
        data: { dueAmount: newDue, paymentStatus: newDue <= 0 ? 'PAID' : 'PARTIAL' },
      }),
      ...(sale.customerId ? [
        prisma.customer.update({ where: { id: sale.customerId }, data: { dues: { decrement: amount } } }),
        prisma.ledger.create({ data: { customerId: sale.customerId, type: 'CREDIT', amount, notes: `Payment for Sale #${saleId}` } }),
      ] : []),
    ]);
    sendSuccess(res, { message: 'Payment recorded', remainingDue: newDue });
  } catch (err) { next(err); }
};

export const returnSale = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const saleId = parseInt(req.params.id);
    const { items } = req.body;
    const sale = await prisma.sale.findUnique({ where: { id: saleId }, include: { items: true } });
    if (!sale) throw new AppError('Sale not found', 404);

    await prisma.$transaction(async (tx) => {
      for (const ret of items) {
        const saleItem = sale.items.find(i => i.id === ret.saleItemId);
        if (!saleItem) throw new AppError(`Item ${ret.saleItemId} not found`, 404);
        if (ret.quantity > saleItem.quantity) throw new AppError('Return quantity exceeds sold quantity', 400);

        await tx.stock.update({
          where: { productId_branchId: { productId: saleItem.productId, branchId: sale.branchId } },
          data: { quantity: { increment: ret.quantity } },
        });
        if (ret.quantity === saleItem.quantity) {
          await tx.saleItem.delete({ where: { id: saleItem.id } });
        } else {
          await tx.saleItem.update({ where: { id: saleItem.id }, data: { quantity: { decrement: ret.quantity } } });
        }
      }
      const remaining = await tx.saleItem.findMany({ where: { saleId } });
      const newTotal = remaining.reduce((sum, i) => sum + i.rate * i.quantity - i.discount, 0);
      await tx.sale.update({ where: { id: saleId }, data: { totalAmount: newTotal } });
    });
    sendSuccess(res, { message: 'Sale return processed' });
  } catch (err) { next(err); }
};
