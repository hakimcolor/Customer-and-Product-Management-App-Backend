import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';

export const getLoans = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { loanType } = req.query;
    sendSuccess(res, await prisma.loan.findMany({
      where: loanType ? { loanType: String(loanType) as any } : undefined,
      orderBy: { date: 'desc' },
    }));
  } catch (err) { next(err); }
};

export const createLoan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    sendSuccess(res, await prisma.loan.create({ data: req.body }), 201);
  } catch (err) { next(err); }
};

export const updateLoan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const loan = await prisma.loan.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!loan) throw new AppError('Loan not found', 404);
    sendSuccess(res, await prisma.loan.update({ where: { id: loan.id }, data: req.body }));
  } catch (err) { next(err); }
};

export const deleteLoan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.loan.delete({ where: { id: parseInt(req.params.id) } });
    sendSuccess(res, { message: 'Loan deleted' });
  } catch (err) { next(err); }
};

export const getCapital = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    sendSuccess(res, await prisma.capital.findMany({ orderBy: { date: 'desc' } }));
  } catch (err) { next(err); }
};

export const createCapital = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    sendSuccess(res, await prisma.capital.create({ data: req.body }), 201);
  } catch (err) { next(err); }
};

export const updateCapital = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    sendSuccess(res, await prisma.capital.update({ where: { id: parseInt(req.params.id) }, data: req.body }));
  } catch (err) { next(err); }
};
