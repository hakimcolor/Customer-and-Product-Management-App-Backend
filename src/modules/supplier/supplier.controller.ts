import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';
import { getPagination, paginate } from '../../utils/pagination';

export const getSuppliers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search } = req.query;
    const { skip, take, page, limit } = getPagination(req);
    const where = search
      ? {
          OR: [
            {
              name: { contains: String(search), mode: 'insensitive' as const },
            },
            { phone: { contains: String(search) } },
          ],
        }
      : undefined;
    const [data, total] = await Promise.all([
      prisma.supplier.findMany({ where, skip, take, orderBy: { name: 'asc' } }),
      prisma.supplier.count({ where }),
    ]);
    sendSuccess(res, paginate(data, total, page, limit));
  } catch (err) {
    next(err);
  }
};

export const createSupplier = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    sendSuccess(res, await prisma.supplier.create({ data: req.body }), 201);
  } catch (err) {
    next(err);
  }
};

export const getSupplier = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { purchases: { orderBy: { date: 'desc' }, take: 10 } },
    });
    if (!supplier) throw new AppError('Supplier not found', 404);
    sendSuccess(res, supplier);
  } catch (err) {
    next(err);
  }
};

export const updateSupplier = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    sendSuccess(
      res,
      await prisma.supplier.update({
        where: { id: parseInt(req.params.id) },
        data: req.body,
      })
    );
  } catch (err) {
    next(err);
  }
};

export const deleteSupplier = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await prisma.supplier.delete({ where: { id: parseInt(req.params.id) } });
    sendSuccess(res, { message: 'Supplier deleted' });
  } catch (err) {
    next(err);
  }
};

export const getSupplierLedger = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { skip, take, page, limit } = getPagination(req);
    const id = parseInt(req.params.id);
    const [data, total] = await Promise.all([
      prisma.ledger.findMany({
        where: { supplierId: id },
        skip,
        take,
        orderBy: { date: 'desc' },
      }),
      prisma.ledger.count({ where: { supplierId: id } }),
    ]);
    sendSuccess(res, paginate(data, total, page, limit));
  } catch (err) {
    next(err);
  }
};

export const getSupplierStatement = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const supplierId = parseInt(req.params.id);
    const { startDate, endDate } = req.query;
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier) throw new AppError('Supplier not found', 404);
    const dr =
      startDate && endDate
        ? { gte: new Date(String(startDate)), lte: new Date(String(endDate)) }
        : undefined;

    const [purchases, payments, returns] = await Promise.all([
      prisma.purchase.findMany({
        where: { supplierId, ...(dr && { date: dr }) },
        include: { items: { include: { product: true } } },
        orderBy: { date: 'desc' },
      }),
      prisma.payment.findMany({
        where: { supplierId, ...(dr && { date: dr }) },
        orderBy: { date: 'desc' },
      }),
      prisma.purchaseReturn.findMany({
        where: { purchase: { supplierId } },
        include: { items: { include: { product: true } } },
        orderBy: { date: 'desc' },
      }),
    ]);
    const totalPurchases = purchases.reduce((s, x) => s + x.totalAmount, 0);
    const totalPaid = payments.reduce((s, x) => s + x.amount, 0);
    const totalReturns = returns.reduce((s, x) => s + x.totalAmount, 0);
    sendSuccess(res, {
      supplier,
      summary: {
        totalPurchases,
        totalPaid,
        totalReturns,
        currentDues: supplier.dues,
      },
      purchases,
      payments,
      returns,
    });
  } catch (err) {
    next(err);
  }
};
