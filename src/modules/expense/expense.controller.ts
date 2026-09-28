import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess } from '../../utils/response';
import { getPagination, paginate } from '../../utils/pagination';

export const getExpenses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category, startDate, endDate } = req.query;
    const { skip, take, page, limit } = getPagination(req);
    const where = {
      ...(category && { category: String(category) }),
      ...(startDate && endDate && { date: { gte: new Date(String(startDate)), lte: new Date(String(endDate)) } }),
    };
    const [data, total] = await Promise.all([
      prisma.expense.findMany({ where, skip, take, orderBy: { date: 'desc' } }),
      prisma.expense.count({ where }),
    ]);
    sendSuccess(res, paginate(data, total, page, limit));
  } catch (err) { next(err); }
};

export const createExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const voucherImage = (req as any).file?.path || undefined;
    const data = { ...req.body, ...(voucherImage && { voucherImage }) };
    sendSuccess(res, await prisma.expense.create({ data }), 201);
  } catch (err) { next(err); }
};

export const updateExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    sendSuccess(res, await prisma.expense.update({ where: { id: parseInt(req.params.id) }, data: req.body }));
  } catch (err) { next(err); }
};

export const deleteExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.expense.delete({ where: { id: parseInt(req.params.id) } });
    sendSuccess(res, { message: 'Expense deleted' });
  } catch (err) { next(err); }
};
