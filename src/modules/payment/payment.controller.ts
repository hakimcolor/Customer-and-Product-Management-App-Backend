import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess } from '../../utils/response';
import { getPagination, paginate } from '../../utils/pagination';

export const getPayments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { customerId, supplierId, startDate, endDate, type, search } =
      req.query;
    const { skip, take, page, limit } = getPagination(req);
    const where: Record<string, unknown> = {
      ...(customerId && { customerId: parseInt(String(customerId)) }),
      ...(supplierId && { supplierId: parseInt(String(supplierId)) }),
      ...(type === 'customer' && { customerId: { not: null } }),
      ...(type === 'supplier' && { supplierId: { not: null } }),
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
            customer: {
              name: { contains: String(search), mode: 'insensitive' as const },
            },
          },
          {
            supplier: {
              name: { contains: String(search), mode: 'insensitive' as const },
            },
          },
          { notes: { contains: String(search), mode: 'insensitive' as const } },
        ],
      }),
    };
    const [data, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take,
        orderBy: { date: 'desc' },
        include: {
          customer: true,
          supplier: true,
          account: { select: { id: true, name: true } },
        },
      }),
      prisma.payment.count({ where }),
    ]);
    sendSuccess(res, paginate(data, total, page, limit));
  } catch (err) {
    next(err);
  }
};

export const customerPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { customerId, amount, paymentType, notes } = req.body;
    await prisma.$transaction([
      prisma.payment.create({
        data: { customerId, amount, paymentType, notes },
      }),
      prisma.customer.update({
        where: { id: customerId },
        data: { dues: { decrement: amount } },
      }),
      prisma.ledger.create({
        data: {
          customerId,
          type: 'CREDIT',
          amount,
          description: notes || 'Direct payment',
          refType: 'payment',
        },
      }),
    ]);
    sendSuccess(res, { message: 'Customer payment recorded' }, 201);
  } catch (err) {
    next(err);
  }
};

export const supplierPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { supplierId, amount, paymentType, notes } = req.body;
    await prisma.$transaction([
      prisma.payment.create({
        data: { supplierId, amount, paymentType, notes },
      }),
      prisma.supplier.update({
        where: { id: supplierId },
        data: { dues: { decrement: amount } },
      }),
      prisma.ledger.create({
        data: {
          supplierId,
          type: 'CREDIT',
          amount,
          description: notes || 'Direct payment',
          refType: 'payment',
        },
      }),
    ]);
    sendSuccess(res, { message: 'Supplier payment recorded' }, 201);
  } catch (err) {
    next(err);
  }
};

export const getPaymentReceipt = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { customer: true, supplier: true, sale: true, purchase: true },
    });
    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment not found' });
      return;
    }
    // Get company settings
    const settings = await prisma.systemSetting.findMany({
      where: { group: 'company' },
    });
    const company: Record<string, string> = {};
    for (const s of settings) company[s.key] = s.value;
    sendSuccess(res, {
      company,
      payment,
      receiptNo: `REC-${String(payment.id).padStart(6, '0')}`,
    });
  } catch (err) {
    next(err);
  }
};

export const searchByInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { invoiceNo } = req.query;
    if (!invoiceNo) {
      res
        .status(400)
        .json({ success: false, message: 'invoiceNo is required' });
      return;
    }
    const q = String(invoiceNo);
    const [sale, purchase] = await Promise.all([
      prisma.sale.findFirst({
        where: { invoiceNo: { contains: q, mode: 'insensitive' } },
        include: {
          customer: true,
          branch: true,
          items: { include: { product: true } },
          payments: true,
        },
      }),
      prisma.purchase.findFirst({
        where: { invoiceNo: { contains: q, mode: 'insensitive' } },
        include: {
          supplier: true,
          branch: true,
          items: { include: { product: true } },
          payments: true,
        },
      }),
    ]);
    sendSuccess(res, { sale: sale || null, purchase: purchase || null });
  } catch (err) {
    next(err);
  }
};
