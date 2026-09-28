import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess } from '../../utils/response';

export const getBranches = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    sendSuccess(res, await prisma.branch.findMany({ orderBy: { name: 'asc' } }));
  } catch (err) { next(err); }
};

export const createBranch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    sendSuccess(res, await prisma.branch.create({ data: req.body }), 201);
  } catch (err) { next(err); }
};

export const updateBranch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    sendSuccess(res, await prisma.branch.update({ where: { id: parseInt(req.params.id) }, data: req.body }));
  } catch (err) { next(err); }
};

export const deleteBranch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.branch.delete({ where: { id: parseInt(req.params.id) } });
    sendSuccess(res, { message: 'Branch deleted' });
  } catch (err) { next(err); }
};
