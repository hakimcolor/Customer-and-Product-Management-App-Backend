import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';
import { getPagination, paginate } from '../../utils/pagination';

// ── Categories ───────────────────────────────────────────────
export const getCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { sendSuccess(res, await prisma.category.findMany({ orderBy: { name: 'asc' } })); }
  catch (err) { next(err); }
};
export const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { sendSuccess(res, await prisma.category.create({ data: req.body }), 201); }
  catch (err) { next(err); }
};
export const updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { sendSuccess(res, await prisma.category.update({ where: { id: parseInt(req.params.id) }, data: req.body })); }
  catch (err) { next(err); }
};
export const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.category.delete({ where: { id: parseInt(req.params.id) } });
    sendSuccess(res, { message: 'Category deleted' });
  } catch (err) { next(err); }
};

// ── Brands ────────────────────────────────────────────────────
export const getBrands = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { sendSuccess(res, await prisma.brand.findMany({ orderBy: { name: 'asc' } })); }
  catch (err) { next(err); }
};
export const createBrand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { sendSuccess(res, await prisma.brand.create({ data: req.body }), 201); }
  catch (err) { next(err); }
};
export const updateBrand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { sendSuccess(res, await prisma.brand.update({ where: { id: parseInt(req.params.id) }, data: req.body })); }
  catch (err) { next(err); }
};
export const deleteBrand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.brand.delete({ where: { id: parseInt(req.params.id) } });
    sendSuccess(res, { message: 'Brand deleted' });
  } catch (err) { next(err); }
};

// ── Products ──────────────────────────────────────────────────
export const getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, categoryId, brandId, barcode } = req.query;
    const { skip, take, page, limit } = getPagination(req);
    const where = {
      ...(barcode && { barcode: String(barcode) }),
      ...(categoryId && { categoryId: parseInt(String(categoryId)) }),
      ...(brandId && { brandId: parseInt(String(brandId)) }),
      ...(search && { title: { contains: String(search), mode: 'insensitive' as const } }),
    };
    const [data, total] = await Promise.all([
      prisma.product.findMany({ where, skip, take, include: { category: true, brand: true }, orderBy: { title: 'asc' } }),
      prisma.product.count({ where }),
    ]);
    sendSuccess(res, paginate(data, total, page, limit));
  } catch (err) { next(err); }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    sendSuccess(res, await prisma.product.create({ data: req.body, include: { category: true, brand: true } }), 201);
  } catch (err) { next(err); }
};

export const getProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const p = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { category: true, brand: true, stocks: { include: { branch: true } } },
    });
    if (!p) throw new AppError('Product not found', 404);
    sendSuccess(res, p);
  } catch (err) { next(err); }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    sendSuccess(res, await prisma.product.update({ where: { id: parseInt(req.params.id) }, data: req.body }));
  } catch (err) { next(err); }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.product.delete({ where: { id: parseInt(req.params.id) } });
    sendSuccess(res, { message: 'Product deleted' });
  } catch (err) { next(err); }
};

export const getProductStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    sendSuccess(res, await prisma.stock.findMany({
      where: { productId: parseInt(req.params.id) },
      include: { branch: true },
    }));
  } catch (err) { next(err); }
};

// ── Stock Operations ──────────────────────────────────────────
export const setOpeningStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId, branchId, quantity } = req.body;
    const stock = await prisma.stock.upsert({
      where: { productId_branchId: { productId, branchId } },
      update: { openingStock: quantity, quantity },
      create: { productId, branchId, openingStock: quantity, quantity, onStock: quantity },
    });
    sendSuccess(res, stock);
  } catch (err) { next(err); }
};

export const transferStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { fromBranchId, toBranchId, productId, quantity } = req.body;
    const fromStock = await prisma.stock.findUnique({
      where: { productId_branchId: { productId, branchId: fromBranchId } },
    });
    if (!fromStock || fromStock.quantity < quantity) {
      throw new AppError('Insufficient stock in source branch', 400);
    }
    const [transfer] = await prisma.$transaction([
      prisma.stockTransfer.create({ data: { fromBranchId, toBranchId, productId, quantity } }),
      prisma.stock.update({
        where: { productId_branchId: { productId, branchId: fromBranchId } },
        data: { quantity: { decrement: quantity } },
      }),
      prisma.stock.upsert({
        where: { productId_branchId: { productId, branchId: toBranchId } },
        update: { quantity: { increment: quantity } },
        create: { productId, branchId: toBranchId, quantity, openingStock: 0, onStock: quantity },
      }),
    ]);
    sendSuccess(res, transfer, 201);
  } catch (err) { next(err); }
};

export const getStockAlerts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { branchId } = req.query;
    const stocks = await prisma.stock.findMany({
      where: {
        ...(branchId && { branchId: parseInt(String(branchId)) }),
      },
      include: { product: { include: { category: true, brand: true } }, branch: true },
    });
    const alerts = stocks.filter(s => s.quantity <= s.product.alertQuantity);
    sendSuccess(res, alerts);
  } catch (err) { next(err); }
};

export const recordDamage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId, branchId, quantity, reason } = req.body;
    const [damage] = await prisma.$transaction([
      prisma.damage.create({ data: { productId, branchId, quantity, reason } }),
      prisma.stock.update({
        where: { productId_branchId: { productId, branchId } },
        data: { quantity: { decrement: quantity } },
      }),
    ]);
    sendSuccess(res, damage, 201);
  } catch (err) { next(err); }
};

export const getDamages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { branchId } = req.query;
    sendSuccess(res, await prisma.damage.findMany({
      where: branchId ? { branchId: parseInt(String(branchId)) } : undefined,
      include: { product: true, branch: true },
      orderBy: { date: 'desc' },
    }));
  } catch (err) { next(err); }
};
