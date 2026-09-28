import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';
import { getPagination, paginate } from '../../utils/pagination';

// ── Accounts ─────────────────────────────────────────────────
export const getAccounts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { branchId, accountType } = req.query;
    sendSuccess(
      res,
      await prisma.account.findMany({
        where: {
          ...(branchId && { branchId: parseInt(String(branchId)) }),
          ...(accountType && { accountType: String(accountType) as never }),
        },
        include: { branch: true },
        orderBy: { name: 'asc' },
      })
    );
  } catch (err) {
    next(err);
  }
};

export const createAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = { ...req.body, balance: req.body.openingBalance || 0 };
    sendSuccess(res, await prisma.account.create({ data }), 201);
  } catch (err) {
    next(err);
  }
};

export const getAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const acc = await prisma.account.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        branch: true,
        transactions: { orderBy: { date: 'desc' }, take: 50 },
      },
    });
    if (!acc) throw new AppError('Account not found', 404);
    sendSuccess(res, acc);
  } catch (err) {
    next(err);
  }
};

export const updateAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    sendSuccess(
      res,
      await prisma.account.update({
        where: { id: parseInt(req.params.id) },
        data: req.body,
      })
    );
  } catch (err) {
    next(err);
  }
};

export const deleteAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await prisma.account.update({
      where: { id: parseInt(req.params.id) },
      data: { status: false },
    });
    sendSuccess(res, { message: 'Account deactivated' });
  } catch (err) {
    next(err);
  }
};

// ── Transactions ──────────────────────────────────────────────
export const getTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { accountId, startDate, endDate } = req.query;
    const { skip, take, page, limit } = getPagination(req);
    const where: Record<string, unknown> = {
      ...(accountId && { accountId: parseInt(String(accountId)) }),
      ...(startDate &&
        endDate && {
          date: {
            gte: new Date(String(startDate)),
            lte: new Date(String(endDate)),
          },
        }),
    };
    const [data, total] = await Promise.all([
      prisma.accountTransaction.findMany({
        where,
        skip,
        take,
        include: { account: true },
        orderBy: { date: 'desc' },
      }),
      prisma.accountTransaction.count({ where }),
    ]);
    sendSuccess(res, paginate(data, total, page, limit));
  } catch (err) {
    next(err);
  }
};

export const deposit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { accountId, amount, description, refType, refId } = req.body;
    const acc = await prisma.account.findUnique({ where: { id: accountId } });
    if (!acc) throw new AppError('Account not found', 404);
    const newBalance = acc.balance + amount;
    await prisma.$transaction([
      prisma.accountTransaction.create({
        data: {
          accountId,
          type: 'DEPOSIT',
          amount,
          balance: newBalance,
          description,
          refType,
          refId,
        },
      }),
      prisma.account.update({
        where: { id: accountId },
        data: { balance: newBalance },
      }),
    ]);
    sendSuccess(res, { message: 'Deposit recorded', balance: newBalance }, 201);
  } catch (err) {
    next(err);
  }
};

export const withdraw = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { accountId, amount, description, refType, refId } = req.body;
    const acc = await prisma.account.findUnique({ where: { id: accountId } });
    if (!acc) throw new AppError('Account not found', 404);
    if (acc.balance < amount) throw new AppError('Insufficient balance', 400);
    const newBalance = acc.balance - amount;
    await prisma.$transaction([
      prisma.accountTransaction.create({
        data: {
          accountId,
          type: 'WITHDRAWAL',
          amount,
          balance: newBalance,
          description,
          refType,
          refId,
        },
      }),
      prisma.account.update({
        where: { id: accountId },
        data: { balance: newBalance },
      }),
    ]);
    sendSuccess(
      res,
      { message: 'Withdrawal recorded', balance: newBalance },
      201
    );
  } catch (err) {
    next(err);
  }
};

export const transfer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { fromAccountId, toAccountId, amount, description } = req.body;
    const [from, to] = await Promise.all([
      prisma.account.findUnique({ where: { id: fromAccountId } }),
      prisma.account.findUnique({ where: { id: toAccountId } }),
    ]);
    if (!from || !to) throw new AppError('Account not found', 404);
    if (from.balance < amount) throw new AppError('Insufficient balance', 400);
    const fromBalance = from.balance - amount;
    const toBalance = to.balance + amount;
    await prisma.$transaction([
      prisma.accountTransaction.create({
        data: {
          accountId: fromAccountId,
          type: 'TRANSFER',
          amount,
          balance: fromBalance,
          description: description || `Transfer to ${to.name}`,
        },
      }),
      prisma.accountTransaction.create({
        data: {
          accountId: toAccountId,
          type: 'TRANSFER',
          amount,
          balance: toBalance,
          description: description || `Transfer from ${from.name}`,
        },
      }),
      prisma.account.update({
        where: { id: fromAccountId },
        data: { balance: fromBalance },
      }),
      prisma.account.update({
        where: { id: toAccountId },
        data: { balance: toBalance },
      }),
    ]);
    sendSuccess(res, { message: 'Transfer completed', fromBalance, toBalance });
  } catch (err) {
    next(err);
  }
};

export const getAccountStatement = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    const accountId = parseInt(req.params.id);
    const acc = await prisma.account.findUnique({ where: { id: accountId } });
    if (!acc) throw new AppError('Account not found', 404);
    const transactions = await prisma.accountTransaction.findMany({
      where: {
        accountId,
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
    sendSuccess(res, { account: acc, transactions });
  } catch (err) {
    next(err);
  }
};
