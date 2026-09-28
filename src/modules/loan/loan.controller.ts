import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';

export const getLoans = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { loanType, status } = req.query;
    sendSuccess(
      res,
      await prisma.loan.findMany({
        where: {
          ...(loanType && { loanType: String(loanType) as never }),
          ...(status && { status: status as never }),
        },
        include: { payments: true },
        orderBy: { startDate: 'desc' },
      })
    );
  } catch (err) {
    next(err);
  }
};

export const createLoan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = { ...req.body, balance: req.body.amount };
    sendSuccess(res, await prisma.loan.create({ data }), 201);
  } catch (err) {
    next(err);
  }
};

export const getLoan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const loan = await prisma.loan.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { payments: true },
    });
    if (!loan) throw new AppError('Loan not found', 404);
    sendSuccess(res, loan);
  } catch (err) {
    next(err);
  }
};

export const updateLoan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const loan = await prisma.loan.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!loan) throw new AppError('Loan not found', 404);
    sendSuccess(
      res,
      await prisma.loan.update({ where: { id: loan.id }, data: req.body })
    );
  } catch (err) {
    next(err);
  }
};

export const deleteLoan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await prisma.loan.delete({ where: { id: parseInt(req.params.id) } });
    sendSuccess(res, { message: 'Loan deleted' });
  } catch (err) {
    next(err);
  }
};

export const makeLoanPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const loanId = parseInt(req.params.id);
    const { amount, notes } = req.body;
    const loan = await prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) throw new AppError('Loan not found', 404);
    if (amount > loan.balance)
      throw new AppError('Payment exceeds remaining balance', 400);

    const newBalance = loan.balance - amount;
    const newStatus = newBalance <= 0 ? 'FULLY_PAID' : 'PARTIALLY_PAID';
    await prisma.$transaction([
      prisma.loanPayment.create({ data: { loanId, amount, notes } }),
      prisma.loan.update({
        where: { id: loanId },
        data: { balance: newBalance, status: newStatus },
      }),
    ]);
    sendSuccess(res, {
      message: 'Loan payment recorded',
      remainingBalance: newBalance,
    });
  } catch (err) {
    next(err);
  }
};

// ── Capital ───────────────────────────────────────────────────
export const getCapital = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    sendSuccess(
      res,
      await prisma.capital.findMany({
        include: { transactions: true },
        orderBy: { date: 'desc' },
      })
    );
  } catch (err) {
    next(err);
  }
};

export const createCapital = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = { ...req.body, balance: req.body.amount };
    sendSuccess(res, await prisma.capital.create({ data }), 201);
  } catch (err) {
    next(err);
  }
};

export const updateCapital = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    sendSuccess(
      res,
      await prisma.capital.update({
        where: { id: parseInt(req.params.id) },
        data: req.body,
      })
    );
  } catch (err) {
    next(err);
  }
};

export const capitalTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const capitalId = parseInt(req.params.id);
    const { type, amount, notes } = req.body; // type: INVESTMENT or WITHDRAWAL
    const capital = await prisma.capital.findUnique({
      where: { id: capitalId },
    });
    if (!capital) throw new AppError('Capital record not found', 404);

    const newBalance =
      type === 'INVESTMENT'
        ? capital.balance + amount
        : capital.balance - amount;
    if (newBalance < 0) throw new AppError('Insufficient capital balance', 400);

    await prisma.$transaction([
      prisma.capitalTransaction.create({
        data: { capitalId, type, amount, notes },
      }),
      prisma.capital.update({
        where: { id: capitalId },
        data: { balance: newBalance, amount: newBalance },
      }),
    ]);
    sendSuccess(res, {
      message: `Capital ${type.toLowerCase()} recorded`,
      newBalance,
    });
  } catch (err) {
    next(err);
  }
};

export const checkOverdueLoans = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Mark loans as OVERDUE if dueDate has passed and balance > 0
    const result = await prisma.loan.updateMany({
      where: {
        dueDate: { lt: new Date() },
        balance: { gt: 0 },
        status: { in: ['ACTIVE', 'PARTIALLY_PAID'] },
      },
      data: { status: 'OVERDUE' },
    });
    sendSuccess(res, { message: `${result.count} loan(s) marked as overdue` });
  } catch (err) {
    next(err);
  }
};
