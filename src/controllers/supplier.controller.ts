import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getSuppliers = async (_req: Request, res: Response): Promise<void> => {
  res.json(await prisma.supplier.findMany());
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
