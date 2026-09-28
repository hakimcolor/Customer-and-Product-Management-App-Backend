import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const dailySummary = async (req: Request, res: Response): Promise<void> => {
  const { date, branchId } = req.query;
  const day = date ? new Date(String(date)) : new Date();
  const start = new Date(day.setHours(0, 0, 0, 0));
  const end = new Date(day.setHours(23, 59, 59, 999));
  const where = { date: { gte: start, lte: end }, ...(branchId && { branchId: parseInt(String(branchId)) }) };

  const [sales, purchases, expenses, payments] = await Promise.all([
    prisma.sale.aggregate({ where, _sum: { totalAmount: true }, _count: true }),
    prisma.purchase.aggregate({ where, _sum: { totalAmount: true }, _count: true }),
    prisma.expense.aggregate({ where: { date: { gte: start, lte: end } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { date: { gte: start, lte: end } }, _sum: { amount: true } }),
  ]);
  res.json({ sales, purchases, expenses, payments });
};

export const bestSellingProducts = async (req: Request, res: Response): Promise<void> => {
  const { startDate, endDate } = req.query;
  const items = await prisma.saleItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
    ...(startDate && endDate && {
      where: { sale: { date: { gte: new Date(String(startDate)), lte: new Date(String(endDate)) } } },
    }),
    orderBy: { _sum: { quantity: 'desc' } },
    take: 10,
  });
  res.json(items);
};

export const customerDues = async (_req: Request, res: Response): Promise<void> => {
  const customers = await prisma.customer.findMany({ where: { dues: { gt: 0 } } });
  res.json(customers);
};

export const supplierDues = async (_req: Request, res: Response): Promise<void> => {
  const suppliers = await prisma.supplier.findMany({ where: { dues: { gt: 0 } } });
  res.json(suppliers);
};

export const stockReport = async (req: Request, res: Response): Promise<void> => {
  const { branchId } = req.query;
  const stock = await prisma.stock.findMany({
    where: branchId ? { branchId: parseInt(String(branchId)) } : undefined,
    include: { product: true, branch: true },
  });
  res.json(stock);
};

export const profitReport = async (req: Request, res: Response): Promise<void> => {
  const { startDate, endDate } = req.query;
  const where = startDate && endDate
    ? { date: { gte: new Date(String(startDate)), lte: new Date(String(endDate)) } }
    : {};
  const [sales, expenses] = await Promise.all([
    prisma.sale.aggregate({ where, _sum: { totalAmount: true, discount: true } }),
    prisma.expense.aggregate({ where: startDate && endDate ? { date: { gte: new Date(String(startDate)), lte: new Date(String(endDate)) } } : {}, _sum: { amount: true } }),
  ]);
  res.json({ sales, expenses, profit: (sales._sum.totalAmount || 0) - (expenses._sum.amount || 0) });
};

export const ledgerReport = async (req: Request, res: Response): Promise<void> => {
  const { customerId, supplierId } = req.query;
  const ledger = await prisma.ledger.findMany({
    where: {
      ...(customerId && { customerId: parseInt(String(customerId)) }),
      ...(supplierId && { supplierId: parseInt(String(supplierId)) }),
    },
    orderBy: { date: 'desc' },
  });
  res.json(ledger);
};

export const smsLogReport = async (_req: Request, res: Response): Promise<void> => {
  res.json(await prisma.sMSLog.findMany({ orderBy: { date: 'desc' } }));
};
