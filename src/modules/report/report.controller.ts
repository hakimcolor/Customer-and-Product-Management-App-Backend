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
    const { branchId, categoryId, warehouseId, lowStock, status, search } =
      req.query;
    const { skip, take, page, limit } = (
      await import('../../utils/pagination')
    ).getPagination(req);
    const where: Record<string, unknown> = {
      ...(branchId && { branchId: parseInt(String(branchId)) }),
      ...(warehouseId && { warehouseId: parseInt(String(warehouseId)) }),
      ...(categoryId && {
        product: { categoryId: parseInt(String(categoryId)) },
      }),
      ...(search && {
        product: {
          title: { contains: String(search), mode: 'insensitive' as const },
        },
      }),
    };
    const stock = await prisma.stock.findMany({
      where,
      include: {
        product: { include: { category: true, brand: true } },
        branch: true,
        warehouse: true,
      },
      orderBy: { product: { title: 'asc' } },
    });

    let result = stock;
    if (lowStock === 'true' || status === 'low') {
      result = stock.filter(
        (s) => s.quantity > 0 && s.quantity <= s.product.alertQuantity
      );
    } else if (status === 'out') {
      result = stock.filter((s) => s.quantity <= 0);
    } else if (status === 'damaged') {
      result = stock.filter((s) => (s.damagedQuantity ?? 0) > 0);
    }

    const totalValue = result.reduce(
      (sum, s) => sum + s.quantity * s.product.purchasePrice,
      0
    );
    const paginated = result.slice(skip, skip + take);
    const { paginate } = await import('../../utils/pagination');
    sendSuccess(res, {
      ...paginate(paginated, result.length, page, limit),
      totalValue,
    });
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
    const { branchId, period = 'today' } = req.query;
    const bw = branchId ? { branchId: parseInt(String(branchId)) } : {};
    const now = new Date();
    let start = new Date();
    let end = new Date(now);

    if (period === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'yesterday') {
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'week') {
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'last_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
    }

    const dateWhere = { gte: start, lte: end };

    const [
      periodSales,
      periodPurchases,
      periodExpenses,
      paymentsReceived,
      paymentsMade,
      totalCustomerDues,
      totalSupplierDues,
      cashBalance,
      bankBalance,
      allStocks,
      recentSales,
      recentPurchases,
      recentPayments,
      recentExpenses,
      branchSales,
    ] = await Promise.all([
      prisma.sale.aggregate({
        where: { date: dateWhere, ...bw },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.purchase.aggregate({
        where: { date: dateWhere, ...bw },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where: { date: dateWhere },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { date: dateWhere, customerId: { not: null } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { date: dateWhere, supplierId: { not: null } },
        _sum: { amount: true },
      }),
      prisma.customer.aggregate({ _sum: { dues: true } }),
      prisma.supplier.aggregate({ _sum: { dues: true } }),
      prisma.account.aggregate({
        where: { accountType: 'CASH', status: true },
        _sum: { balance: true },
      }),
      prisma.account.aggregate({
        where: { accountType: 'BANK', status: true },
        _sum: { balance: true },
      }),
      prisma.stock.findMany({
        include: {
          product: { select: { purchasePrice: true, alertQuantity: true } },
        },
      }),
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
      prisma.payment.findMany({
        include: { customer: true, supplier: true },
        orderBy: { date: 'desc' },
        take: 5,
      }),
      prisma.expense.findMany({ orderBy: { date: 'desc' }, take: 5 }),
      prisma.sale.groupBy({
        by: ['branchId'],
        where: {
          date: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
        },
        _sum: { totalAmount: true },
        _count: true,
      }),
    ]);

    const totalStockValue = allStocks.reduce(
      (sum, s) => sum + s.quantity * s.product.purchasePrice,
      0
    );
    const lowStockCount = allStocks.filter(
      (s) => s.quantity > 0 && s.quantity <= s.product.alertQuantity
    ).length;
    const outOfStockCount = allStocks.filter((s) => s.quantity <= 0).length;
    const revenue = periodSales._sum.totalAmount || 0;
    const cogs = periodPurchases._sum.totalAmount || 0;
    const expenses = periodExpenses._sum.amount || 0;

    sendSuccess(res, {
      period,
      // Top-level fields that frontend dashboard reads directly
      periodSales: {
        _sum: { totalAmount: revenue },
        _count: periodSales._count,
      },
      periodPurchases: {
        _sum: { totalAmount: cogs },
        _count: periodPurchases._count,
      },
      periodExpenses: { _sum: { amount: expenses } },
      totalCustomerDues: totalCustomerDues._sum.dues || 0,
      totalSupplierDues: totalSupplierDues._sum.dues || 0,
      cashBalance: cashBalance._sum.balance || 0,
      bankBalance: bankBalance._sum.balance || 0,
      stockValue: totalStockValue,
      lowStockCount,
      outOfStockCount,
      recentSales,
      lowStockProducts: allStocks
        .filter((s) => s.quantity > 0 && s.quantity <= s.product.alertQuantity)
        .slice(0, 5)
        .map((s) => ({
          name:
            (
              s.product as {
                title?: string;
                purchasePrice: number;
                alertQuantity: number;
              }
            ).title ?? 'Product',
          currentStock: s.quantity,
          alertQty: s.product.alertQuantity,
        })),
      totalProducts: allStocks.length,
      // Nested summary for compatibility
      summary: {
        totalSales: revenue,
        salesCount: periodSales._count,
        totalPurchases: cogs,
        purchasesCount: periodPurchases._count,
        totalExpenses: expenses,
        receivedPayments: paymentsReceived._sum.amount || 0,
        supplierPayments: paymentsMade._sum.amount || 0,
        grossProfit: revenue - cogs,
        netProfit: revenue - cogs - expenses,
      },
      balances: {
        totalCustomerDues: totalCustomerDues._sum.dues || 0,
        totalSupplierDues: totalSupplierDues._sum.dues || 0,
        totalCashBalance: cashBalance._sum.balance || 0,
        totalBankBalance: bankBalance._sum.balance || 0,
      },
      inventory: { totalStockValue, lowStockCount, outOfStockCount },
      recent: {
        sales: recentSales,
        purchases: recentPurchases,
        payments: recentPayments,
        expenses: recentExpenses,
      },
      branchSales,
    });
  } catch (err) {
    next(err);
  }
};

export const productSalesReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate, branchId, categoryId } = req.query;
    const dr = dateRange(String(startDate || ''), String(endDate || ''));
    const items = await prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        ...(dr && { sale: { date: dr } }),
        ...(branchId && { sale: { branchId: parseInt(String(branchId)) } }),
      },
      _sum: { quantity: true, rate: true },
      _count: true,
    });
    const products = await prisma.product.findMany({
      where: {
        id: { in: items.map((i) => i.productId) },
        ...(categoryId && { categoryId: parseInt(String(categoryId)) }),
      },
      include: { category: true, brand: true },
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

export const damageReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate, branchId } = req.query;
    const dr = dateRange(String(startDate || ''), String(endDate || ''));
    const damages = await prisma.damage.findMany({
      where: {
        ...(dr && { date: dr }),
        ...(branchId && { branchId: parseInt(String(branchId)) }),
      },
      include: { product: true, branch: true },
      orderBy: { date: 'desc' },
    });
    const totalLoss = damages.reduce((sum, d) => sum + d.lossAmount, 0);
    sendSuccess(res, { totalLoss, count: damages.length, data: damages });
  } catch (err) {
    next(err);
  }
};

export const transferReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate, branchId, status } = req.query;
    const dr = dateRange(String(startDate || ''), String(endDate || ''));
    sendSuccess(
      res,
      await prisma.stockTransfer.findMany({
        where: {
          ...(dr && { requestedAt: dr }),
          ...(status && { status: String(status) as never }),
          ...(branchId && {
            OR: [
              { fromBranchId: parseInt(String(branchId)) },
              { toBranchId: parseInt(String(branchId)) },
            ],
          }),
        },
        include: {
          fromBranch: true,
          toBranch: true,
          items: { include: { product: true } },
        },
        orderBy: { requestedAt: 'desc' },
      })
    );
  } catch (err) {
    next(err);
  }
};

export const cashFlowReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    const dr = dateRange(String(startDate || ''), String(endDate || ''));
    const [paymentsIn, paymentsOut, expenses, loanPayments] = await Promise.all(
      [
        prisma.payment.findMany({
          where: { ...(dr && { date: dr }), customerId: { not: null } },
          orderBy: { date: 'asc' },
        }),
        prisma.payment.findMany({
          where: { ...(dr && { date: dr }), supplierId: { not: null } },
          orderBy: { date: 'asc' },
        }),
        prisma.expense.findMany({
          where: { ...(dr && { date: dr }) },
          orderBy: { date: 'asc' },
        }),
        prisma.loanPayment.findMany({
          where: { ...(dr && { date: dr }) },
          include: { loan: true },
          orderBy: { date: 'asc' },
        }),
      ]
    );
    const totalIn = paymentsIn.reduce((s, p) => s + p.amount, 0);
    const totalOut =
      paymentsOut.reduce((s, p) => s + p.amount, 0) +
      expenses.reduce((s, e) => s + e.amount, 0);
    sendSuccess(res, {
      totalInflow: totalIn,
      totalOutflow: totalOut,
      netCashFlow: totalIn - totalOut,
      paymentsReceived: paymentsIn,
      paymentsMade: paymentsOut,
      expenses,
      loanPayments,
    });
  } catch (err) {
    next(err);
  }
};

export const monthlyChart = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { months = '12', branchId } = req.query;
    const bw = branchId ? { branchId: parseInt(String(branchId)) } : {};
    const since = new Date();
    since.setMonth(since.getMonth() - parseInt(String(months)));
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const [sales, purchases, expenses] = await Promise.all([
      prisma.sale.groupBy({
        by: ['date'],
        where: { date: { gte: since }, ...bw },
        _sum: { totalAmount: true },
      }),
      prisma.purchase.groupBy({
        by: ['date'],
        where: { date: { gte: since }, ...bw },
        _sum: { totalAmount: true },
      }),
      prisma.expense.groupBy({
        by: ['date'],
        where: { date: { gte: since } },
        _sum: { amount: true },
      }),
    ]);

    // Group by YYYY-MM
    const groupByMonth = (
      rows: {
        date: Date;
        _sum: { totalAmount?: number | null; amount?: number | null };
      }[]
    ) => {
      const map: Record<string, number> = {};
      for (const r of rows) {
        const key = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, '0')}`;
        map[key] = (map[key] || 0) + (r._sum.totalAmount || r._sum.amount || 0);
      }
      return map;
    };

    const salesMap = groupByMonth(sales as never);
    const purchasesMap = groupByMonth(purchases as never);
    const expensesMap = groupByMonth(expenses as never);

    // Build sorted array for charts
    const allKeys = Array.from(
      new Set([
        ...Object.keys(salesMap),
        ...Object.keys(purchasesMap),
        ...Object.keys(expensesMap),
      ])
    ).sort();

    const monthlySales = allKeys.map((month) => ({
      month,
      sales: salesMap[month] || 0,
      purchases: purchasesMap[month] || 0,
      expenses: expensesMap[month] || 0,
      profit:
        (salesMap[month] || 0) -
        (purchasesMap[month] || 0) -
        (expensesMap[month] || 0),
    }));

    sendSuccess(res, {
      monthlySales,
      salesMap,
      purchasesMap,
      expensesMap,
    });
  } catch (err) {
    next(err);
  }
};

export const stockMovementHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { productId, branchId, type, startDate, endDate } = req.query;
    const { skip, take, page, limit } = (
      await import('../../utils/pagination')
    ).getPagination(req);
    const dr = dateRange(String(startDate || ''), String(endDate || ''));
    const where: Record<string, unknown> = {
      ...(productId && { productId: parseInt(String(productId)) }),
      ...(branchId && { branchId: parseInt(String(branchId)) }),
      ...(type && { type: String(type) as never }),
      ...(dr && { createdAt: dr }),
    };
    const [data, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip,
        take,
        include: { product: true, branch: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.stockMovement.count({ where }),
    ]);
    const { paginate } = await import('../../utils/pagination');
    sendSuccess(res, paginate(data, total, page, limit));
  } catch (err) {
    next(err);
  }
};
