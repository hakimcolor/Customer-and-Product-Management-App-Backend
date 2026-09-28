import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';
import { getPagination, paginate } from '../../utils/pagination';

export const getCustomers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search } = req.query;
    const { skip, take, page, limit } = getPagination(req);
    const where = search
      ? { OR: [{ name: { contains: String(search), mode: 'insensitive' as const } }, { phone: { contains: String(search) } }] }
      : undefined;
    const [data, total] = await Promise.all([
      prisma.customer.findMany({ where, skip, take, orderBy: { name: 'asc' } }),
      prisma.customer.count({ where }),
    ]);
    sendSuccess(res, paginate(data, total, page, limit));
  } catch (err) { next(err); }
};

export const createCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    sendSuccess(res, await prisma.customer.create({ data: req.body }), 201);
  } catch (err) { next(err); }
};

export const getCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { sales: { orderBy: { date: 'desc' }, take: 10 }, payments: { orderBy: { date: 'desc' }, take: 10 } },
    });
    if (!customer) throw new AppError('Customer not found', 404);
    sendSuccess(res, customer);
  } catch (err) { next(err); }
};

export const updateCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    sendSuccess(res, await prisma.customer.update({ where: { id: parseInt(req.params.id) }, data: req.body }));
  } catch (err) { next(err); }
};

export const deleteCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.customer.delete({ where: { id: parseInt(req.params.id) } });
    sendSuccess(res, { message: 'Customer deleted' });
  } catch (err) { next(err); }
};

export const getCustomerLedger = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { skip, take, page, limit } = getPagination(req);
    const id = parseInt(req.params.id);
    const [data, total] = await Promise.all([
      prisma.ledger.findMany({ where: { customerId: id }, skip, take, orderBy: { date: 'desc' } }),
      prisma.ledger.count({ where: { customerId: id } }),
    ]);
    sendSuccess(res, paginate(data, total, page, limit));
  } catch (err) { next(err); }
};
