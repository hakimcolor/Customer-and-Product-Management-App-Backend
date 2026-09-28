import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';
import { getPagination, paginate } from '../../utils/pagination';

export const getSuppliers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search } = req.query;
    const { skip, take, page, limit } = getPagination(req);
    const where = search
      ? { OR: [{ name: { contains: String(search), mode: 'insensitive' as const } }, { phone: { contains: String(search) } }] }
      : undefined;
    const [data, total] = await Promise.all([
      prisma.supplier.findMany({ where, skip, take, orderBy: { name: 'asc' } }),
      prisma.supplier.count({ where }),
    ]);
    sendSuccess(res, paginate(data, total, page, limit));
  } catch (err) { next(err); }
};

export const createSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    sendSuccess(res, await prisma.supplier.create({ data: req.body }), 201);
  } catch (err) { next(err); }
};

export const getSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { purchases: { orderBy: { date: 'desc' }, take: 10 } },
    });
    if (!supplier) throw new AppError('Supplier not found', 404);
    sendSuccess(res, supplier);
  } catch (err) { next(err); }
};

export const updateSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    sendSuccess(res, await prisma.supplier.update({ where: { id: parseInt(req.params.id) }, data: req.body }));
  } catch (err) { next(err); }
};

export const deleteSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.supplier.delete({ where: { id: parseInt(req.params.id) } });
    sendSuccess(res, { message: 'Supplier deleted' });
  } catch (err) { next(err); }
};

export const getSupplierLedger = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { skip, take, page, limit } = getPagination(req);
    const id = parseInt(req.params.id);
    const [data, total] = await Promise.all([
      prisma.ledger.findMany({ where: { supplierId: id }, skip, take, orderBy: { date: 'desc' } }),
      prisma.ledger.count({ where: { supplierId: id } }),
    ]);
    sendSuccess(res, paginate(data, total, page, limit));
  } catch (err) { next(err); }
};
