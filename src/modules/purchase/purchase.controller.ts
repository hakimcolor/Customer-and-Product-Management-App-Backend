import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';
import { getPagination, paginate } from '../../utils/pagination';
import { recordStockMovement } from '../../utils/stockMovement';

export const getPurchases = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { supplierId, branchId, startDate, endDate, paymentStatus } =
      req.query;
    const { skip, take, page, limit } = getPagination(req);
    const where: Record<string, unknown> = {
      ...(supplierId && { supplierId: parseInt(String(supplierId)) }),
      ...(branchId && { branchId: parseInt(String(branchId)) }),
      ...(paymentStatus && { paymentStatus: String(paymentStatus) as never }),
      ...(startDate &&
        endDate && {
          date: {
            gte: new Date(String(startDate)),
            lte: new Date(String(endDate)),
          },
        }),
    };
    const [data, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        skip,
        take,
        orderBy: { date: 'desc' },
        include: {
          supplier: true,
          branch: true,
          items: { include: { product: true } },
        },
      }),
      prisma.purchase.count({ where }),
    ]);
    sendSuccess(res, paginate(data, total, page, limit));
  } catch (err) {
    next(err);
  }
};

export const createPurchase = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      supplierId,
      branchId,
      items,
      totalAmount,
      discount,
      vat,
      dueAmount,
      paymentStatus,
      notes,
    } = req.body;
    const count = await prisma.purchase.count();
    const invoiceNo = `PUR-${String(count + 1).padStart(6, '0')}`;

    const purchase = await prisma.$transaction(async (tx) => {
      const p = await tx.purchase.create({
        data: {
          invoiceNo,
          supplierId,
          branchId,
          totalAmount,
          discount: discount || 0,
          vat: vat || 0,
          dueAmount,
          paymentStatus,
          notes,
          items: { create: items },
        },
        include: { items: { include: { product: true } }, supplier: true },
      });
      // Update stock for each item + record movement
      for (const item of items) {
        const existing = await tx.stock.findFirst({
          where: { productId: item.productId, branchId, warehouseId: null },
        });
        if (existing) {
          await tx.stock.update({
            where: { id: existing.id },
            data: { quantity: { increment: item.quantity } },
          });
          await recordStockMovement(tx, {
            productId: item.productId,
            branchId,
            type: 'PURCHASE',
            quantity: item.quantity,
            before: existing.quantity,
            refType: 'purchase',
            refId: p.id,
          });
        } else {
          await tx.stock.create({
            data: {
              productId: item.productId,
              branchId,
              quantity: item.quantity,
              openingStock: 0,
            },
          });
          await recordStockMovement(tx, {
            productId: item.productId,
            branchId,
            type: 'PURCHASE',
            quantity: item.quantity,
            before: 0,
            refType: 'purchase',
            refId: p.id,
          });
        }
      }
      // Update supplier dues & ledger
      if (dueAmount > 0) {
        await tx.supplier.update({
          where: { id: supplierId },
          data: { dues: { increment: dueAmount } },
        });
        await tx.ledger.create({
          data: {
            supplierId,
            type: 'DEBIT',
            amount: totalAmount,
            description: `Purchase #${p.invoiceNo}`,
            refType: 'purchase',
            refId: p.id,
          },
        });
      }
      return p;
    });
    sendSuccess(res, purchase, 201);
  } catch (err) {
    next(err);
  }
};

export const getPurchase = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const p = await prisma.purchase.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        supplier: true,
        branch: true,
        items: { include: { product: true } },
        payments: true,
      },
    });
    if (!p) throw new AppError('Purchase not found', 404);
    sendSuccess(res, p);
  } catch (err) {
    next(err);
  }
};

export const updatePurchase = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const p = await prisma.purchase.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!p) throw new AppError('Purchase not found', 404);
    sendSuccess(
      res,
      await prisma.purchase.update({ where: { id: p.id }, data: req.body })
    );
  } catch (err) {
    next(err);
  }
};

export const makePurchasePayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const purchaseId = parseInt(req.params.id);
    const { amount, paymentType, notes } = req.body;
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
    });
    if (!purchase) throw new AppError('Purchase not found', 404);
    if (amount > purchase.dueAmount)
      throw new AppError('Payment exceeds due amount', 400);

    const newDue = purchase.dueAmount - amount;
    await prisma.$transaction([
      prisma.payment.create({
        data: {
          purchaseId,
          supplierId: purchase.supplierId,
          amount,
          paymentType,
          notes,
        },
      }),
      prisma.purchase.update({
        where: { id: purchaseId },
        data: {
          dueAmount: newDue,
          paymentStatus: newDue <= 0 ? 'PAID' : 'PARTIAL',
        },
      }),
      prisma.supplier.update({
        where: { id: purchase.supplierId },
        data: { dues: { decrement: amount } },
      }),
      prisma.ledger.create({
        data: {
          supplierId: purchase.supplierId,
          type: 'CREDIT',
          amount,
          description: `Payment for Purchase #${purchase.invoiceNo}`,
          refType: 'payment',
          refId: purchaseId,
        },
      }),
    ]);
    sendSuccess(res, { message: 'Payment recorded', remainingDue: newDue });
  } catch (err) {
    next(err);
  }
};

export const returnPurchase = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const purchaseId = parseInt(req.params.id);
    const { items, reason } = req.body;
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { items: true },
    });
    if (!purchase) throw new AppError('Purchase not found', 404);

    await prisma.$transaction(async (tx) => {
      let returnTotal = 0;
      const returnItems: {
        productId: number;
        quantity: number;
        rate: number;
      }[] = [];

      for (const ret of items) {
        const pItem = purchase.items.find((i) => i.id === ret.purchaseItemId);
        if (!pItem)
          throw new AppError(`Item ${ret.purchaseItemId} not found`, 404);
        if (ret.quantity > pItem.quantity)
          throw new AppError('Return quantity exceeds purchased quantity', 400);

        const stockEntry = await tx.stock.findFirst({
          where: {
            productId: pItem.productId,
            branchId: purchase.branchId,
            warehouseId: null,
          },
        });
        if (stockEntry) {
          await tx.stock.update({
            where: { id: stockEntry.id },
            data: { quantity: { decrement: ret.quantity } },
          });
        }
        returnTotal += pItem.rate * ret.quantity;
        returnItems.push({
          productId: pItem.productId,
          quantity: ret.quantity,
          rate: pItem.rate,
        });
      }
      await tx.purchaseReturn.create({
        data: {
          purchaseId,
          totalAmount: returnTotal,
          reason,
          items: { create: returnItems },
        },
      });
    });
    sendSuccess(res, { message: 'Purchase return processed' });
  } catch (err) {
    next(err);
  }
};

export const getPurchaseReturns = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    sendSuccess(
      res,
      await prisma.purchaseReturn.findMany({
        include: {
          purchase: { include: { supplier: true } },
          items: { include: { product: true } },
        },
        orderBy: { date: 'desc' },
      })
    );
  } catch (err) {
    next(err);
  }
};
