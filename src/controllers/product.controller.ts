import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { getPagination, paginatedResponse } from '../utils/pagination';

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  const { search, categoryId, brandId, barcode } = req.query;
  const { skip, take, page, limit } = getPagination(req);
  const where = {
    ...(barcode && { barcode: String(barcode) }),
    ...(categoryId && { categoryId: parseInt(String(categoryId)) }),
    ...(brandId && { brandId: parseInt(String(brandId)) }),
    ...(search && { title: { contains: String(search), mode: 'insensitive' as const } }),
  };
  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, skip, take, include: { category: true, brand: true }, orderBy: { title: 'asc' } }),
    prisma.product.count({ where }),
  ]);
  res.json(paginatedResponse(products, total, page, limit));
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  const product = await prisma.product.create({ data: req.body, include: { category: true, brand: true } });
  res.status(201).json(product);
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  const product = await prisma.product.update({ where: { id: parseInt(req.params.id) }, data: req.body });
  res.json(product);
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  await prisma.product.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ message: 'Product deleted' });
};

export const getProductStock = async (req: Request, res: Response): Promise<void> => {
  const stock = await prisma.stock.findMany({ where: { productId: parseInt(req.params.id) }, include: { branch: true } });
  res.json(stock);
};

export const setOpeningStock = async (req: Request, res: Response): Promise<void> => {
  const { productId, branchId, quantity } = req.body;
  const stock = await prisma.stock.upsert({
    where: { productId_branchId: { productId, branchId } },
    update: { openingStock: quantity, quantity },
    create: { productId, branchId, openingStock: quantity, quantity, onStock: quantity },
  });
  res.json(stock);
};

export const transferStock = async (req: Request, res: Response): Promise<void> => {
  const { fromBranchId, toBranchId, productId, quantity } = req.body;
  const [transfer] = await prisma.$transaction([
    prisma.stockTransfer.create({ data: { fromBranchId, toBranchId, productId, quantity } }),
    prisma.stock.update({ where: { productId_branchId: { productId, branchId: fromBranchId } }, data: { quantity: { decrement: quantity } } }),
    prisma.stock.upsert({
      where: { productId_branchId: { productId, branchId: toBranchId } },
      update: { quantity: { increment: quantity } },
      create: { productId, branchId: toBranchId, quantity, openingStock: 0, onStock: quantity },
    }),
  ]);
  res.json(transfer);
};

export const getStockAlerts = async (_req: Request, res: Response): Promise<void> => {
  const products = await prisma.product.findMany({
    include: { stocks: true },
  });
  const alerts = products.filter(p => p.stocks.some(s => s.quantity <= p.alertQuantity));
  res.json(alerts);
};
