import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess } from '../../utils/response';

export const dailySummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { date, branchId } = req.query;
    const day = date ? new Date(String(date)) : new Date();
    const start = new Date(day); start.setHours(0, 0, 0, 0);
    const end = new Date(day); end.setHours(23, 59, 59, 999);
    const branchWhere = branchId ? { branchId: parseInt(String(branchId)) } : {};

    const [sales, purchases, expenses, payments] = await Promise.all([
      prisma.sale.aggregate({ where: { date: { gte: start, lte: end }, ...branchWhere }, _sum: { totalAmount: true, discount: true }, _count: true }),
      prisma.purchase.aggregate({ where: { date: { gte: start, lte: end }, ...branchWhere }, _sum: { totalAmount: true }, _count: true }),
      prisma.expense.aggregate({ where: { date: { gte: start, lte: end } }, _sum: { amount: true }, _count: true }),
      prisma.payment.aggregate({ where: { date: { gte: start, lte: end } }, _sum: { amount: true }, _count: true }),
    ]);
    sendSuccess(res, { date: start, sales, purchases, expenses, payments });
  } catch (err) { next(err); }
};

export const bestSellingProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate, limit = '10' } = req.query;
    const items = await prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      ...(startDate && endDate && {
        where: { sale: { date: { gte: new Date(String(startDate)), lte: new Date(String(endDate)) } } },
      }),
      orderBy: { _sum: { quantity: 'desc' } },
      take: parseInt(String(limit)),
    });
    // Enrich with product data
    const productIds = items.map(i => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } }, include: { category: true, brand: true } });
    const result = items.map(i => ({
      ...i,
      product: products.find(p => p.id === i.productId),
    }));
    sendSuccess(res, result);
  } catch (err) { next(err); }
};

export const customerDues = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search } = req.query;
    const customers = await prisma.customer.findMany({
      where: {
        dues: { gt: 0 },
        ...(search && { name: { contains: String(search), mode: 'insensitive' } }),
      },
      orderBy: { dues: 'desc' },
    });
    sendSuccess(res, customers);
  } catch (err) { next(err); }
};

export const supplierDues = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    sendSuccess(res, await prisma.supplier.findMany({ where: { dues: { gt: 0 } }, orderBy: { dues: 'desc' } }));
  } catch (err) { next(err); }
};

export const stockReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { branchId, categoryId } = req.query;
    const stock = await prisma.stock.findMany({
      where: {
        ...(branchId && { branchId: parseInt(String(branchId)) }),
        ...(categoryId && { product: { categoryId: parseInt(String(categoryId)) } }),
      },
      include: { product: { include: { category: true, brand: true } }, branch: true },
      orderBy: { product: { title: 'asc' } },
    });
    sendSuccess(res, stock);
  } catch (err) { next(err); }
};

export const profitReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate, branchId } = req.query;
    const dateWhere = startDate && endDate ? { gte: new Date(String(startDate)), lte: new Date(String(endDate)) } : undefined;
    const branchWhere = branchId ? { branchId: parseInt(String(branchId)) } : {};

    const [salesData, purchasesData, expensesData] = await Promise.all([
      prisma.sale.aggregate({ where: { ...(dateWhere && { date: dateWhere }), ...branchWhere }, _sum: { totalAmount: true, discount: true } }),
      prisma.purchase.aggregate({ where: { ...(dateWhere && { date: dateWhere }), ...branchWhere }, _sum: { totalAmount: true } }),
      prisma.expense.aggregate({ where: dateWhere ? { date: dateWhere } : {}, _sum: { amount: true } }),
    ]);

    const revenue = salesData._sum.totalAmount || 0;
    const cogs = purchasesData._sum.totalAmount || 0;
    const expenses = expensesData._sum.amount || 0;
    sendSuccess(res, { revenue, cogs, expenses, grossProfit: revenue - cogs, netProfit: revenue - cogs - expenses });
  } catch (err) { next(err); }
};

export const ledgerReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { customerId, supplierId, startDate, endDate } = req.query;
    const ledger = await prisma.ledger.findMany({
      where: {
        ...(customerId && { customerId: parseInt(String(customerId)) }),
        ...(supplierId && { supplierId: parseInt(String(supplierId)) }),
        ...(startDate && endDate && { date: { gte: new Date(String(startDate)), lte: new Date(String(endDate)) } }),
      },
      include: { customer: true, supplier: true },
      orderBy: { date: 'desc' },
    });
    sendSuccess(res, ledger);
  } catch (err) { next(err); }
};
