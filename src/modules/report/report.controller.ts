import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess } from '../../utils/response';

const dateRange = (startDate?: string, endDate?: string) =>
  startDate && endDate
    ? { gte: new Date(startDate), lte: new Date(endDate) }
    : undefined;

export const dailySummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { date, branchId } = req.query;
    const day = date ? new Date(String(date)) : new Date();
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(day);
    end.setHours(23, 59, 59, 999);
    const bw = branchId ? { branchId: parseInt(String(branchId)) } : {};

    const [sales, purchases, expenses, payments, customerDues, supplierDues] =
      await Promise.all([
        prisma.sale.aggregate({
          where: { date: { gte: start, lte: end }, ...bw },
          _sum: { totalAmount: true, discount: true, dueAmount: true },
          _count: true,
        }),
        prisma.purchase.aggregate({
          where: { date: { gte: start, lte: end }, ...bw },
          _sum: { totalAmount: true, dueAmount: true },
          _count: true,
        }),
        prisma.expense.aggregate({
          where: { date: { gte: start, lte: end } },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.payment.aggregate({
          where: { date: { gte: start, lte: end } },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.customer.aggregate({ _sum: { dues: true } }),
        prisma.supplier.aggregate({ _sum: { dues: true } }),
      ]);
    sendSuccess(res, {
      date: start,
      sales,
      purchases,
      expenses,
      payments,
      customerDues: customerDues._sum.dues,
      supplierDues: supplierDues._sum.dues,
    });
  } catch (err) {
    next(err);
  }
};

export const salesReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate, branchId, customerId, paymentStatus } =
      req.query;
    const dr = dateRange(String(startDate || ''), String(endDate || ''));
    const sales = await prisma.sale.findMany({
      where: {
        ...(dr && { date: dr }),
        ...(branchId && { branchId: parseInt(String(branchId)) }),
        ...(customerId && { customerId: parseInt(String(customerId)) }),
        ...(paymentStatus && { paymentStatus: String(paymentStatus) as never }),
      },
      include: {
        customer: true,
        branch: true,
        items: { include: { product: true } },
        payments: true,
      },
      orderBy: { date: 'desc' },
    });
    const totals = sales.reduce(
      (acc, s) => ({
        revenue: acc.revenue + s.totalAmount,
        discount: acc.discount + s.discount,
        due: acc.due + s.dueAmount,
      }),
      { revenue: 0, discount: 0, due: 0 }
    );
    sendSuccess(res, { totals, count: sales.length, data: sales });
  } catch (err) {
    next(err);
  }
};

export const purchasesReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate, branchId, supplierId, paymentStatus } =
      req.query;
    const dr = dateRange(String(startDate || ''), String(endDate || ''));
    const purchases = await prisma.purchase.findMany({
      where: {
        ...(dr && { date: dr }),
        ...(branchId && { branchId: parseInt(String(branchId)) }),
        ...(supplierId && { supplierId: parseInt(String(supplierId)) }),
        ...(paymentStatus && { paymentStatus: String(paymentStatus) as never }),
      },
      include: {
        supplier: true,
        branch: true,
        items: { include: { product: true } },
      },
      orderBy: { date: 'desc' },
    });
    const totals = purchases.reduce(
      (acc, p) => ({
        total: acc.total + p.totalAmount,
        due: acc.due + p.dueAmount,
      }),
      { total: 0, due: 0 }
    );
    sendSuccess(res, { totals, count: purchases.length, data: purchases });
  } catch (err) {
    next(err);
  }
};

export const bestSellingProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate, limit = '10', branchId } = req.query;
    const dr = dateRange(String(startDate || ''), String(endDate || ''));
    const items = await prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      where: {
        ...(dr && { sale: { date: dr } }),
        ...(branchId && { sale: { branchId: parseInt(String(branchId)) } }),
      },
      orderBy: { _sum: { quantity: 'desc' } },
      take: parseInt(String(limit)),
    });
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { category: true },
    });
    sendSuccess(
      res,
      items.map((i) => ({
        ...i,
        product: products.find((p) => p.id === i.productId),
      }))
    );
  } catch (err) {
    next(err);
  }
};

export const customerDues = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search } = req.query;
    sendSuccess(
      res,
      await prisma.customer.findMany({
        where: {
          dues: { gt: 0 },
          ...(search && {
            name: { contains: String(search), mode: 'insensitive' },
          }),
        },
        orderBy: { dues: 'desc' },
      })
    );
  } catch (err) {
    next(err);
  }
};

export const supplierDues = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    sendSuccess(
      res,
      await prisma.supplier.findMany({
        where: { dues: { gt: 0 } },
        orderBy: { dues: 'desc' },
      })
    );
  } catch (err) {
    next(err);
  }
};

export const stockReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { branchId, categoryId, warehouseId, lowStock } = req.query;
    const stock = await prisma.stock.findMany({
      where: {
        ...(branchId && { branchId: parseInt(String(branchId)) }),
        ...(warehouseId && { warehouseId: parseInt(String(warehouseId)) }),
        ...(categoryId && {
          product: { categoryId: parseInt(String(categoryId)) },
        }),
      },
      include: {
        product: { include: { category: true, brand: true } },
        branch: true,
      },
      orderBy: { product: { title: 'asc' } },
    });
    const result =
      lowStock === 'true'
        ? stock.filter((s) => s.quantity <= s.product.alertQuantity)
        : stock;
    const totalValue = result.reduce(
      (sum, s) => sum + s.quantity * s.product.purchasePrice,
      0
    );
    sendSuccess(res, { totalValue, count: result.length, data: result });
  } catch (err) {
    next(err);
  }
};

export const profitReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate, branchId } = req.query;
    const dr = dateRange(String(startDate || ''), String(endDate || ''));
    const bw = branchId ? { branchId: parseInt(String(branchId)) } : {};

    const [salesData, purchasesData, expensesData] = await Promise.all([
      prisma.sale.aggregate({
        where: { ...(dr && { date: dr }), ...bw },
        _sum: { totalAmount: true, discount: true },
      }),
      prisma.purchase.aggregate({
        where: { ...(dr && { date: dr }), ...bw },
        _sum: { totalAmount: true },
      }),
      prisma.expense.aggregate({
        where: { ...(dr && { date: dr }) },
        _sum: { amount: true },
      }),
    ]);

    const revenue = salesData._sum.totalAmount || 0;
    const cogs = purchasesData._sum.totalAmount || 0;
    const expenses = expensesData._sum.amount || 0;
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - expenses;
    sendSuccess(res, {
      revenue,
      cogs,
      expenses,
      grossProfit,
      netProfit,
      grossMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
    });
  } catch (err) {
    next(err);
  }
};

export const ledgerReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { customerId, supplierId, startDate, endDate } = req.query;
    const dr = dateRange(String(startDate || ''), String(endDate || ''));
    const ledger = await prisma.ledger.findMany({
      where: {
        ...(customerId && { customerId: parseInt(String(customerId)) }),
        ...(supplierId && { supplierId: parseInt(String(supplierId)) }),
        ...(dr && { date: dr }),
      },
      include: { customer: true, supplier: true },
      orderBy: { date: 'asc' },
    });
    // Running balance
    let runningBalance = 0;
    const result = ledger.map((e) => {
      runningBalance += e.type === 'DEBIT' ? e.amount : -e.amount;
      return { ...e, runningBalance };
    });
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export const expenseReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate, branchId, category } = req.query;
    const dr = dateRange(String(startDate || ''), String(endDate || ''));
    const expenses = await prisma.expense.findMany({
      where: {
        ...(dr && { date: dr }),
        ...(branchId && { branchId: parseInt(String(branchId)) }),
        ...(category && { category: String(category) }),
      },
      include: { branch: true },
      orderBy: { date: 'desc' },
    });
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const byCategory: Record<string, number> = {};
    for (const e of expenses) {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    }
    sendSuccess(res, {
      total,
      byCategory,
      count: expenses.length,
      data: expenses,
    });
  } catch (err) {
    next(err);
  }
};

export const dashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { branchId } = req.query;
    const bw = branchId ? { branchId: parseInt(String(branchId)) } : {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      todaySales,
      todayPurchases,
      totalCustomerDues,
      totalSupplierDues,
      totalStockValue,
      lowStockCount,
      recentSales,
      recentPurchases,
    ] = await Promise.all([
      prisma.sale.aggregate({
        where: { date: { gte: today, lte: todayEnd }, ...bw },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.purchase.aggregate({
        where: { date: { gte: today, lte: todayEnd }, ...bw },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.customer.aggregate({ _sum: { dues: true } }),
      prisma.supplier.aggregate({ _sum: { dues: true } }),
      prisma.stock
        .findMany({ include: { product: true } })
        .then((stocks) =>
          stocks.reduce(
            (sum, s) => sum + s.quantity * s.product.purchasePrice,
            0
          )
        ),
      prisma.stock.count({ where: { product: { stocks: { some: {} } } } }),
      prisma.sale.findMany({
        where: { ...bw },
        include: { customer: true },
        orderBy: { date: 'desc' },
        take: 5,
      }),
      prisma.purchase.findMany({
        where: { ...bw },
        include: { supplier: true },
        orderBy: { date: 'desc' },
        take: 5,
      }),
    ]);

    sendSuccess(res, {
      today: { sales: todaySales, purchases: todayPurchases },
      totals: {
        customerDues: totalCustomerDues._sum.dues || 0,
        supplierDues: totalSupplierDues._sum.dues || 0,
        stockValue: totalStockValue,
      },
      recent: { sales: recentSales, purchases: recentPurchases },
    });
  } catch (err) {
    next(err);
  }
};
