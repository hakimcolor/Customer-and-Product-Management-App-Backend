import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';
import { getPagination, paginate } from '../../utils/pagination';
import { fileToUrl } from '../../utils/upload';
import { recordStockMovement } from '../../utils/stockMovement';

// ── Categories ───────────────────────────────────────────────
export const getCategories = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    sendSuccess(
      res,
      await prisma.category.findMany({
        orderBy: { name: 'asc' },
        include: { subCategories: true },
      })
    );
  } catch (err) {
    next(err);
  }
};
export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    sendSuccess(res, await prisma.category.create({ data: req.body }), 201);
  } catch (err) {
    next(err);
  }
};
export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    sendSuccess(
      res,
      await prisma.category.update({
        where: { id: parseInt(req.params.id) },
        data: req.body,
      })
    );
  } catch (err) {
    next(err);
  }
};
export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await prisma.category.delete({ where: { id: parseInt(req.params.id) } });
    sendSuccess(res, { message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
};

// ── Sub-Categories ────────────────────────────────────────────
export const getSubCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { categoryId } = req.query;
    sendSuccess(
      res,
      await prisma.subCategory.findMany({
        where: categoryId
          ? { categoryId: parseInt(String(categoryId)) }
          : undefined,
        include: { category: true },
        orderBy: { name: 'asc' },
      })
    );
  } catch (err) {
    next(err);
  }
};
export const createSubCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    sendSuccess(
      res,
      await prisma.subCategory.create({
        data: req.body,
        include: { category: true },
      }),
      201
    );
  } catch (err) {
    next(err);
  }
};
export const updateSubCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    sendSuccess(
      res,
      await prisma.subCategory.update({
        where: { id: parseInt(req.params.id) },
        data: req.body,
      })
    );
  } catch (err) {
    next(err);
  }
};
export const deleteSubCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await prisma.subCategory.delete({ where: { id: parseInt(req.params.id) } });
    sendSuccess(res, { message: 'Sub-category deleted' });
  } catch (err) {
    next(err);
  }
};

// ── Brands ────────────────────────────────────────────────────
export const getBrands = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    sendSuccess(res, await prisma.brand.findMany({ orderBy: { name: 'asc' } }));
  } catch (err) {
    next(err);
  }
};
export const createBrand = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    sendSuccess(res, await prisma.brand.create({ data: req.body }), 201);
  } catch (err) {
    next(err);
  }
};
export const updateBrand = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    sendSuccess(
      res,
      await prisma.brand.update({
        where: { id: parseInt(req.params.id) },
        data: req.body,
      })
    );
  } catch (err) {
    next(err);
  }
};
export const deleteBrand = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await prisma.brand.delete({ where: { id: parseInt(req.params.id) } });
    sendSuccess(res, { message: 'Brand deleted' });
  } catch (err) {
    next(err);
  }
};

// ── Units ─────────────────────────────────────────────────────
export const getUnits = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    sendSuccess(res, await prisma.unit.findMany({ orderBy: { name: 'asc' } }));
  } catch (err) {
    next(err);
  }
};
export const createUnit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    sendSuccess(res, await prisma.unit.create({ data: req.body }), 201);
  } catch (err) {
    next(err);
  }
};
export const updateUnit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    sendSuccess(
      res,
      await prisma.unit.update({
        where: { id: parseInt(req.params.id) },
        data: req.body,
      })
    );
  } catch (err) {
    next(err);
  }
};
export const deleteUnit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await prisma.unit.delete({ where: { id: parseInt(req.params.id) } });
    sendSuccess(res, { message: 'Unit deleted' });
  } catch (err) {
    next(err);
  }
};

// ── Products ──────────────────────────────────────────────────
export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search, categoryId, brandId, barcode, sku, status } = req.query;
    const { skip, take, page, limit } = getPagination(req);
    const where: Record<string, unknown> = {
      ...(barcode && { barcode: String(barcode) }),
      ...(sku && { sku: String(sku) }),
      ...(categoryId && { categoryId: parseInt(String(categoryId)) }),
      ...(brandId && { brandId: parseInt(String(brandId)) }),
      ...(status !== undefined && { status: status === 'true' }),
      ...(search && {
        title: { contains: String(search), mode: 'insensitive' as const },
      }),
    };
    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        include: { category: true, brand: true, unit: true },
        orderBy: { title: 'asc' },
      }),
      prisma.product.count({ where }),
    ]);
    sendSuccess(res, paginate(data, total, page, limit));
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    sendSuccess(
      res,
      await prisma.product.create({
        data: req.body,
        include: { category: true, brand: true, unit: true },
      }),
      201
    );
  } catch (err) {
    next(err);
  }
};

export const getProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const p = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        category: true,
        brand: true,
        unit: true,
        stocks: { include: { branch: true } },
      },
    });
    if (!p) throw new AppError('Product not found', 404);
    sendSuccess(res, p);
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    sendSuccess(
      res,
      await prisma.product.update({
        where: { id: parseInt(req.params.id) },
        data: req.body,
      })
    );
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: { status: false },
    });
    sendSuccess(res, { message: 'Product deactivated' });
  } catch (err) {
    next(err);
  }
};

export const getProductStock = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    sendSuccess(
      res,
      await prisma.stock.findMany({
        where: { productId: parseInt(req.params.id) },
        include: { branch: true },
      })
    );
  } catch (err) {
    next(err);
  }
};

// ── Stock Operations ──────────────────────────────────────────
const upsertStock = async (
  tx: Omit<
    typeof prisma,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
  >,
  productId: number,
  branchId: number,
  quantity: number,
  increment: boolean
) => {
  const existing = await tx.stock.findFirst({
    where: { productId, branchId, warehouseId: null },
  });
  if (existing) {
    return tx.stock.update({
      where: { id: existing.id },
      data: {
        quantity: increment ? { increment: quantity } : { decrement: quantity },
      },
    });
  }
  return tx.stock.create({
    data: { productId, branchId, quantity, openingStock: 0 },
  });
};

export const setOpeningStock = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { productId, branchId, quantity } = req.body;
    const existing = await prisma.stock.findFirst({
      where: { productId, branchId, warehouseId: null },
    });
    let stock;
    if (existing) {
      stock = await prisma.stock.update({
        where: { id: existing.id },
        data: { openingStock: quantity, quantity },
      });
    } else {
      stock = await prisma.stock.create({
        data: { productId, branchId, openingStock: quantity, quantity },
      });
    }
    sendSuccess(res, stock);
  } catch (err) {
    next(err);
  }
};

export const adjustStock = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { productId, branchId, quantity, reason, notes } = req.body;
    const existing = await prisma.stock.findFirst({
      where: { productId, branchId, warehouseId: null },
    });
    if (!existing) throw new AppError('Stock record not found', 404);

    await prisma.$transaction([
      prisma.stockAdjustment.create({
        data: { productId, branchId, quantity, reason, notes },
      }),
      prisma.stock.update({
        where: { id: existing.id },
        data: { quantity: { increment: quantity } },
      }),
    ]);
    sendSuccess(res, { message: 'Stock adjusted' }, 201);
  } catch (err) {
    next(err);
  }
};

export const transferStock = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { fromBranchId, toBranchId, items, notes } = req.body;
    // Generate transfer number
    const count = await prisma.stockTransfer.count();
    const transferNo = `TRF-${String(count + 1).padStart(6, '0')}`;

    for (const item of items) {
      const fromStock = await prisma.stock.findFirst({
        where: {
          productId: item.productId,
          branchId: fromBranchId,
          warehouseId: null,
        },
      });
      if (!fromStock || fromStock.quantity < item.quantity) {
        throw new AppError(
          `Insufficient stock for product ID ${item.productId}`,
          400
        );
      }
    }

    const transfer = await prisma.$transaction(async (tx) => {
      const t = await tx.stockTransfer.create({
        data: {
          transferNo,
          fromBranchId,
          toBranchId,
          notes,
          items: { create: items },
        },
        include: { items: { include: { product: true } } },
      });
      for (const item of items) {
        const fromStock = await tx.stock.findFirst({
          where: {
            productId: item.productId,
            branchId: fromBranchId,
            warehouseId: null,
          },
        });
        if (fromStock)
          await tx.stock.update({
            where: { id: fromStock.id },
            data: { quantity: { decrement: item.quantity } },
          });
        const toStock = await tx.stock.findFirst({
          where: {
            productId: item.productId,
            branchId: toBranchId,
            warehouseId: null,
          },
        });
        if (toStock) {
          await tx.stock.update({
            where: { id: toStock.id },
            data: { quantity: { increment: item.quantity } },
          });
        } else {
          await tx.stock.create({
            data: {
              productId: item.productId,
              branchId: toBranchId,
              quantity: item.quantity,
              openingStock: 0,
            },
          });
        }
      }
      return t;
    });
    sendSuccess(res, transfer, 201);
  } catch (err) {
    next(err);
  }
};

export const getStockTransfers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { branchId, status } = req.query;
    sendSuccess(
      res,
      await prisma.stockTransfer.findMany({
        where: {
          ...(branchId && {
            OR: [
              { fromBranchId: parseInt(String(branchId)) },
              { toBranchId: parseInt(String(branchId)) },
            ],
          }),
          ...(status && { status: String(status) as any }),
        },
        include: {
          fromBranch: true,
          toBranch: true,
          items: { include: { product: true } },
        },
        orderBy: { requestedAt: 'desc' },
      })
    );
  } catch (err) {
    next(err);
  }
};

export const updateTransferStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status } = req.body;
    const transfer = await prisma.stockTransfer.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status,
        ...(status === 'APPROVED' && { approvedAt: new Date() }),
        ...(status === 'SENT' && { sentAt: new Date() }),
        ...(status === 'RECEIVED' && { receivedAt: new Date() }),
      },
    });
    sendSuccess(res, transfer);
  } catch (err) {
    next(err);
  }
};

export const getStockAlerts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { branchId } = req.query;
    const stocks = await prisma.stock.findMany({
      where: branchId ? { branchId: parseInt(String(branchId)) } : undefined,
      include: {
        product: { include: { category: true, brand: true } },
        branch: true,
      },
    });
    const alerts = stocks.filter((s) => s.quantity <= s.product.alertQuantity);
    sendSuccess(res, alerts);
  } catch (err) {
    next(err);
  }
};

export const recordDamage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { productId, branchId, quantity, reason, lossAmount } = req.body;
    const existing = await prisma.stock.findFirst({
      where: { productId, branchId, warehouseId: null },
    });
    if (!existing) throw new AppError('Stock not found', 404);

    const [damage] = await prisma.$transaction([
      prisma.damage.create({
        data: {
          productId,
          branchId,
          quantity,
          reason,
          lossAmount: lossAmount || 0,
        },
      }),
      prisma.stock.update({
        where: { id: existing.id },
        data: { quantity: { decrement: quantity } },
      }),
      prisma.stockMovement.create({
        data: {
          productId,
          branchId,
          type: 'DAMAGE',
          quantity: -quantity,
          before: existing.quantity,
          after: existing.quantity - quantity,
          notes: reason,
        },
      }),
    ]);
    sendSuccess(res, damage, 201);
  } catch (err) {
    next(err);
  }
};

export const getDamages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { branchId } = req.query;
    sendSuccess(
      res,
      await prisma.damage.findMany({
        where: branchId ? { branchId: parseInt(String(branchId)) } : undefined,
        include: { product: true, branch: true },
        orderBy: { date: 'desc' },
      })
    );
  } catch (err) {
    next(err);
  }
};

export const getStockAdjustments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { branchId } = req.query;
    sendSuccess(
      res,
      await prisma.stockAdjustment.findMany({
        where: branchId ? { branchId: parseInt(String(branchId)) } : undefined,
        include: { product: true, branch: true },
        orderBy: { date: 'desc' },
      })
    );
  } catch (err) {
    next(err);
  }
};

export const uploadProductImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const productId = parseInt(req.params.id);
    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file) throw new AppError('No image uploaded', 400);
    const image = fileToUrl(file.path);
    sendSuccess(
      res,
      await prisma.product.update({ where: { id: productId }, data: { image } })
    );
  } catch (err) {
    next(err);
  }
};
