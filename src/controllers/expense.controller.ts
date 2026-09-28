import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getExpenses = async (_req: Request, res: Response): Promise<void> => {
  res.json(await prisma.expense.findMany({ orderBy: { date: 'desc' } }));
};

export const createExpense = async (req: Request, res: Response): Promise<void> => {
  const voucherImage = (req as any).file?.path || null;
  const expense = await prisma.expense.create({ data: { ...req.body, voucherImage } });
  res.status(201).json(expense);
};
