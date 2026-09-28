import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { getPagination, paginatedResponse } from '../utils/pagination';

export const getSuppliers = async (req: Request, res: Response): Promise<void> => {
  const { search } = req.query;
  const { skip, take, page, limit } = getPagination(req);
  const where = search ? { OR: [{ name: { contains: String(search), mode: 'insensitive' as const } }, { phone: { contains: String(search) } }] } : undefined;
  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({ where, skip, take, orderBy: { name: 'asc' } }),
    prisma.supplier.count({ where }),
  ]);
  res.json(paginatedResponse(suppliers, total, page, limit));
};

export const createSupplier = async (req: Request, res: Response): Promise<void> => {
  res.status(201).json(await prisma.supplier.create({ data: req.body }));
};

export const getSupplier = async (req: Request, res: Response): Promise<void> => {
  const s = await prisma.supplier.findUnique({ where: { id: parseInt(req.params.id) }, include: { purchases: true } });
  if (!s) { res.status(404).json({ message: 'Supplier not found' }); return; }
  res.json(s);
};

export const updateSupplier = async (req: Request, res: Response): Promise<void> => {
  res.json(await prisma.supplier.update({ where: { id: parseInt(req.params.id) }, data: req.body }));
};

export const getSupplierLedger = async (req: Request, res: Response): Promise<void> => {
  res.json(await prisma.ledger.findMany({ where: { supplierId: parseInt(req.params.id) }, orderBy: { date: 'desc' } }));
};
