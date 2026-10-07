import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';
import { getPagination, paginate } from '../../utils/pagination';
import { recordStockMovement } from '../../utils/stockMovement';

export const getSales = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { customerId, branchId, startDate, endDate, paymentStatus, search } =
      req.query;
    const { skip, take, page, limit } = getPagination(req);
    const where: Record<string, unknown> = {
      ...(customerId && { customerId: parseInt(String(customerId)) }),
      ...(branchId && { branchId: parseInt(String(branchId)) }),
      ...(paymentStatus && { paymentStatus: String(paymentStatus) as never }),
      ...(startDate &&
        endDate && {
          date: {
            gte: new Date(String(startDate)),
            lte: new Date(String(endDate)),
          },
        }),
      ...(search && {
        OR: [
          {
            invoiceNo: {
              contains: String(search),
              mode: 'insensitive' as const,
            },
          },
          {
            customer: {
              name: { contains: String(search), mode: 'insensitive' as const },
            },
          },
        ],
      }),
    };
    const [data, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip,
        take,
        orderBy: { date: 'desc' },
        include: {
          customer: true,
          branch: true,
          items: { include: { product: true } },
        },
      }),
      prisma.sale.count({ where }),
    ]);
    sendSuccess(res, paginate(data, total, page, limit));
  } catch (err) {
    next(err);
  }
};

export const createSale = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      customerId,
      branchId,
      items,
      totalAmount,
      discount,
      vat,
      dueAmount,
      paymentStatus,
      notes,
    } = req.body;
    const count = await prisma.sale.count();
    const invoiceNo = `SAL-${String(count + 1).padStart(6, '0')}`;

    const sale = await prisma.$transaction(async (tx) => {
      // Check stock availability
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
      // Deduct stock + record movement
      for (const item of items) {
        const stock = await tx.stock.findFirst({
          where: { productId: item.productId, branchId, warehouseId: null },
        });
        if (stock) {
          await tx.stock.update({
            where: { id: stock.id },
            data: { quantity: { decrement: item.quantity } },
          });
          await recordStockMovement(tx, {
            productId: item.productId,
            branchId,
            type: 'SALE',
            quantity: -item.quantity,
            before: stock.quantity,
            refType: 'sale',
            refId: s.id,
          });
        }
      }
      // Update customer dues, balance & ledger
      if (customerId && dueAmount > 0) {
        await tx.customer.update({
          where: { id: customerId },
          data: {
            dues: { increment: dueAmount },
            balance: { decrement: dueAmount },
          },
        });
        await tx.ledger.create({
          data: {
            customerId,
            type: 'DEBIT',
            amount: totalAmount,
            description: `Sale #${s.invoiceNo}`,
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

export const getSale = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const s = await prisma.sale.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        customer: true,
        branch: true,
        items: { include: { product: true } },
        payments: true,
        returns: { include: { items: { include: { product: true } } } },
      },
    });
    if (!s) throw new AppError('Sale not found', 404);
    sendSuccess(res, s);
  } catch (err) {
    next(err);
  }
};

export const updateSale = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const s = await prisma.sale.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!s) throw new AppError('Sale not found', 404);
    sendSuccess(
      res,
      await prisma.sale.update({ where: { id: s.id }, data: req.body })
    );
  } catch (err) {
    next(err);
  }
};

export const makeSalePayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const saleId = parseInt(req.params.id);
    const { amount, paymentType, notes } = req.body;
    const sale = await prisma.sale.findUnique({ where: { id: saleId } });
    if (!sale) throw new AppError('Sale not found', 404);
    if (amount > sale.dueAmount)
      throw new AppError('Payment exceeds due amount', 400);

    const newDue = sale.dueAmount - amount;
    const paymentOp = prisma.payment.create({
      data: { saleId, customerId: sale.customerId, amount, paymentType, notes },
    });
    const saleUpdateOp = prisma.sale.update({
      where: { id: saleId },
      data: {
        dueAmount: newDue,
        paymentStatus: newDue <= 0 ? 'PAID' : 'PARTIAL',
      },
    });

    if (sale.customerId) {
      await prisma.$transaction([
        paymentOp,
        saleUpdateOp,
        prisma.customer.update({
          where: { id: sale.customerId },
          data: { dues: { decrement: amount } },
        }),
        prisma.ledger.create({
          data: {
            customerId: sale.customerId,
            type: 'CREDIT',
            amount,
            description: `Payment for Sale #${sale.invoiceNo}`,
            refType: 'payment',
            refId: saleId,
          },
        }),
      ]);
    } else {
      await prisma.$transaction([paymentOp, saleUpdateOp]);
    }
    sendSuccess(res, { message: 'Payment recorded', remainingDue: newDue });
  } catch (err) {
    next(err);
  }
};

export const returnSale = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const saleId = parseInt(req.params.id);
    const { items, reason } = req.body;
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { items: true },
    });
    if (!sale) throw new AppError('Sale not found', 404);

    await prisma.$transaction(async (tx) => {
      let returnTotal = 0;
      const returnItems: {
        productId: number;
        quantity: number;
        rate: number;
      }[] = [];

      for (const ret of items) {
        const saleItem = sale.items.find((i) => i.id === ret.saleItemId);
        if (!saleItem)
          throw new AppError(`Item ${ret.saleItemId} not found`, 404);
        if (ret.quantity > saleItem.quantity)
          throw new AppError('Return quantity exceeds sold quantity', 400);

        const stockEntry = await tx.stock.findFirst({
          where: {
            productId: saleItem.productId,
            branchId: sale.branchId,
            warehouseId: null,
          },
        });
        if (stockEntry) {
          await tx.stock.update({
            where: { id: stockEntry.id },
            data: { quantity: { increment: ret.quantity } },
          });
        }
        returnTotal += saleItem.rate * ret.quantity;
        returnItems.push({
          productId: saleItem.productId,
          quantity: ret.quantity,
          rate: saleItem.rate,
        });
      }
      await tx.saleReturn.create({
        data: {
          saleId,
          totalAmount: returnTotal,
          reason,
          items: { create: returnItems },
        },
      });
      // Restore customer dues if applicable
      if (sale.customerId && returnTotal > 0) {
        await tx.customer.update({
          where: { id: sale.customerId },
          data: { dues: { decrement: returnTotal } },
        });
      }
    });
    sendSuccess(res, { message: 'Sale return processed' });
  } catch (err) {
    next(err);
  }
};

export const getSaleReturns = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    sendSuccess(
      res,
      await prisma.saleReturn.findMany({
        include: {
          sale: { include: { customer: true } },
          items: { include: { product: true } },
        },
        orderBy: { date: 'desc' },
      })
    );
  } catch (err) {
    next(err);
  }
};
