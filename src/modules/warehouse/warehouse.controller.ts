import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';

export const getWarehouses = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { branchId } = req.query;
    sendSuccess(
      res,
      await prisma.warehouse.findMany({
        where: {
          ...(branchId && { branchId: parseInt(String(branchId)) }),
          status: true,
        },
        include: { branch: true },
        orderBy: { name: 'asc' },
      })
    );
  } catch (err) {
    next(err);
  }
};

export const createWarehouse = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    sendSuccess(
      res,
      await prisma.warehouse.create({
        data: req.body,
        include: { branch: true },
      }),
      201
    );
  } catch (err) {
    next(err);
  }
};

export const getWarehouse = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const w = await prisma.warehouse.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { branch: true, stocks: { include: { product: true } } },
    });
    if (!w) throw new AppError('Warehouse not found', 404);
    sendSuccess(res, w);
  } catch (err) {
    next(err);
  }
};

export const updateWarehouse = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    sendSuccess(
      res,
      await prisma.warehouse.update({
        where: { id: parseInt(req.params.id) },
        data: req.body,
      })
    );
  } catch (err) {
    next(err);
  }
};

export const deleteWarehouse = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await prisma.warehouse.update({
      where: { id: parseInt(req.params.id) },
      data: { status: false },
    });
    sendSuccess(res, { message: 'Warehouse deactivated' });
  } catch (err) {
    next(err);
  }
};
