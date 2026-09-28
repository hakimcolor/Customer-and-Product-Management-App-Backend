import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess } from '../../utils/response';
import { getPagination, paginate } from '../../utils/pagination';

export const getPayments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { customerId, supplierId, startDate, endDate } = req.query;
    const { skip, take, page, limit } = getPagination(req);
    const where = {
      ...(customerId && { customerId: parseInt(String(customerId)) }),
      ...(supplierId && { supplierId: parseInt(String(supplierId)) }),
      ...(startDate && endDate && { date: { gte: new Date(String(startDate)), lte: new Date(String(endDate)) } }),
    };
    const [data, total] = await Promise.all([
      prisma.payment.findMany({ where, skip, take, orderBy: { date: 'desc' }, include: { customer: true, supplier: true } }),
      prisma.payment.count({ where }),
    ]);
    sendSuccess(res, paginate(data, total, page, limit));
  } catch (err) { next(err); }
};

export const customerPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { customerId, amount, paymentType, notes } = req.body;
    await prisma.$transaction([
      prisma.payment.create({ data: { customerId, amount, paymentType, notes } }),
      prisma.customer.update({ where: { id: customerId }, data: { dues: { decrement: amount } } }),
      prisma.ledger.create({ data: { customerId, type: 'CREDIT', amount, notes: notes || 'Direct payment' } }),
    ]);
    sendSuccess(res, { message: 'Customer payment recorded' }, 201);
  } catch (err) { next(err); }
};

export const supplierPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { supplierId, amount, paymentType, notes } = req.body;
    await prisma.$transaction([
      prisma.payment.create({ data: { supplierId, amount, paymentType, notes } }),
      prisma.supplier.update({ where: { id: supplierId }, data: { dues: { decrement: amount } } }),
      prisma.ledger.create({ data: { supplierId, type: 'CREDIT', amount, notes: notes || 'Direct payment' } }),
    ]);
    sendSuccess(res, { message: 'Supplier payment recorded' }, 201);
  } catch (err) { next(err); }
};
