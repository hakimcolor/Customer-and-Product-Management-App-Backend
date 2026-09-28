import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';
import { getPagination, paginate } from '../../utils/pagination';

export const getExpenses = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { category, branchId, startDate, endDate, paymentType } = req.query;
    const { skip, take, page, limit } = getPagination(req);
    const where: Record<string, unknown> = {
      ...(category && { category: String(category) }),
      ...(branchId && { branchId: parseInt(String(branchId)) }),
      ...(paymentType && { paymentType: String(paymentType) as never }),
      ...(startDate &&
        endDate && {
          date: {
            gte: new Date(String(startDate)),
            lte: new Date(String(endDate)),
          },
        }),
    };
    const [data, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take,
        include: { branch: true },
        orderBy: { date: 'desc' },
      }),
      prisma.expense.count({ where }),
    ]);
    sendSuccess(res, paginate(data, total, page, limit));
  } catch (err) {
    next(err);
  }
};

export const getExpense = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const exp = await prisma.expense.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { branch: true },
    });
    if (!exp) throw new AppError('Expense not found', 404);
    sendSuccess(res, exp);
  } catch (err) {
    next(err);
  }
};

export const createExpense = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const voucherImage =
      (req as Request & { file?: Express.Multer.File }).file?.path || undefined;
    const data = { ...req.body, ...(voucherImage && { voucherImage }) };
    sendSuccess(
      res,
      await prisma.expense.create({ data, include: { branch: true } }),
      201
    );
  } catch (err) {
    next(err);
  }
};

export const updateExpense = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const exp = await prisma.expense.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!exp) throw new AppError('Expense not found', 404);
    sendSuccess(
      res,
      await prisma.expense.update({ where: { id: exp.id }, data: req.body })
    );
  } catch (err) {
    next(err);
  }
};

export const deleteExpense = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const exp = await prisma.expense.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!exp) throw new AppError('Expense not found', 404);
    await prisma.expense.delete({ where: { id: exp.id } });
    sendSuccess(res, { message: 'Expense deleted' });
  } catch (err) {
    next(err);
  }
};
