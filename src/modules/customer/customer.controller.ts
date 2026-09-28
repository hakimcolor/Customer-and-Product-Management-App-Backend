import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';
import { getPagination, paginate } from '../../utils/pagination';

export const getCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search, status } = req.query;
    const { skip, take, page, limit } = getPagination(req);
    const where: Record<string, unknown> = {
      ...(status !== undefined && { status: status === 'true' }),
      ...(search && {
        OR: [
          { name: { contains: String(search), mode: 'insensitive' as const } },
          { phone: { contains: String(search) } },
          { email: { contains: String(search), mode: 'insensitive' as const } },
          {
            company: { contains: String(search), mode: 'insensitive' as const },
          },
        ],
      }),
    };
    const [data, total] = await Promise.all([
      prisma.customer.findMany({ where, skip, take, orderBy: { name: 'asc' } }),
      prisma.customer.count({ where }),
    ]);
    sendSuccess(res, paginate(data, total, page, limit));
  } catch (err) {
    next(err);
  }
};

export const createCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customer = await prisma.customer.create({ data: req.body });
    // Set opening balance in ledger if provided
    if (req.body.openingBalance && req.body.openingBalance > 0) {
      await prisma.ledger.create({
        data: {
          customerId: customer.id,
          type: 'DEBIT',
          amount: req.body.openingBalance,
          description: 'Opening Balance',
          refType: 'opening',
        },
      });
    }
    sendSuccess(res, customer, 201);
  } catch (err) {
    next(err);
  }
};

export const getCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const c = await prisma.customer.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        sales: {
          orderBy: { date: 'desc' },
          take: 10,
          include: { items: true },
        },
        payments: { orderBy: { date: 'desc' }, take: 10 },
      },
    });
    if (!c) throw new AppError('Customer not found', 404);
    sendSuccess(res, c);
  } catch (err) {
    next(err);
  }
};

export const updateCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const c = await prisma.customer.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!c) throw new AppError('Customer not found', 404);
    sendSuccess(
      res,
      await prisma.customer.update({ where: { id: c.id }, data: req.body })
    );
  } catch (err) {
    next(err);
  }
};

export const deleteCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await prisma.customer.update({
      where: { id: parseInt(req.params.id) },
      data: { status: false },
    });
    sendSuccess(res, { message: 'Customer deactivated' });
  } catch (err) {
    next(err);
  }
};

export const getCustomerLedger = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customerId = parseInt(req.params.id);
    const { startDate, endDate } = req.query;
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) throw new AppError('Customer not found', 404);
    const ledger = await prisma.ledger.findMany({
      where: {
        customerId,
        ...(startDate &&
          endDate && {
            date: {
              gte: new Date(String(startDate)),
              lte: new Date(String(endDate)),
            },
          }),
      },
      orderBy: { date: 'asc' },
    });
    let runningBalance = customer.openingBalance;
    const entries = ledger.map((e) => {
      runningBalance += e.type === 'DEBIT' ? e.amount : -e.amount;
      return { ...e, runningBalance };
    });
    sendSuccess(res, {
      customer,
      openingBalance: customer.openingBalance,
      entries,
      closingBalance: runningBalance,
    });
  } catch (err) {
    next(err);
  }
};

export const getCustomerStatement = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customerId = parseInt(req.params.id);
    const { startDate, endDate } = req.query;
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) throw new AppError('Customer not found', 404);
    const dr =
      startDate && endDate
        ? { gte: new Date(String(startDate)), lte: new Date(String(endDate)) }
        : undefined;

    const [sales, payments, returns] = await Promise.all([
      prisma.sale.findMany({
        where: { customerId, ...(dr && { date: dr }) },
        include: { items: { include: { product: true } } },
        orderBy: { date: 'desc' },
      }),
      prisma.payment.findMany({
        where: { customerId, ...(dr && { date: dr }) },
        orderBy: { date: 'desc' },
      }),
      prisma.saleReturn.findMany({
        where: { sale: { customerId } },
        include: { items: { include: { product: true } } },
        orderBy: { date: 'desc' },
      }),
    ]);
    const totalSales = sales.reduce((s, x) => s + x.totalAmount, 0);
    const totalPaid = payments.reduce((s, x) => s + x.amount, 0);
    const totalReturns = returns.reduce((s, x) => s + x.totalAmount, 0);
    sendSuccess(res, {
      customer,
      summary: {
        totalSales,
        totalPaid,
        totalReturns,
        currentDues: customer.dues,
      },
      sales,
      payments,
      returns,
    });
  } catch (err) {
    next(err);
  }
};
