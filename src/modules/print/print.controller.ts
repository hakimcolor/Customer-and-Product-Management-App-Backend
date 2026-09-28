import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';

export const getSaleInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: parseInt(req.params.saleId) },
      include: {
        customer: true,
        branch: true,
        items: {
          include: {
            product: { include: { category: true, brand: true, unit: true } },
          },
        },
        payments: true,
      },
    });
    if (!sale) throw new AppError('Sale not found', 404);

    // Get company settings
    const settings = await prisma.systemSetting.findMany({
      where: { group: 'company' },
    });
    const company: Record<string, string> = {};
    for (const s of settings) company[s.key] = s.value;

    const subtotal = sale.items.reduce(
      (sum, i) => sum + i.rate * i.quantity,
      0
    );
    const totalDiscount =
      sale.items.reduce((sum, i) => sum + i.discount, 0) + sale.discount;
    const paidAmount = sale.totalAmount - sale.dueAmount;

    sendSuccess(res, {
      company,
      invoiceNo: sale.invoiceNo || `INV-${String(sale.id).padStart(6, '0')}`,
      date: sale.date,
      branch: sale.branch,
      customer: sale.customer,
      items: sale.items.map((i) => ({
        product: i.product.title,
        sku: i.product.sku,
        barcode: i.product.barcode,
        category: i.product.category?.name,
        unit: i.product.unit?.shortName,
        quantity: i.quantity,
        rate: i.rate,
        discount: i.discount,
        vat: i.vat,
        total: i.rate * i.quantity - i.discount,
      })),
      subtotal,
      discount: totalDiscount,
      vat: sale.vat,
      total: sale.totalAmount,
      paid: paidAmount,
      due: sale.dueAmount,
      paymentStatus: sale.paymentStatus,
      payments: sale.payments,
      notes: sale.notes,
    });
  } catch (err) {
    next(err);
  }
};

export const getPurchaseInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: { id: parseInt(req.params.purchaseId) },
      include: {
        supplier: true,
        branch: true,
        items: { include: { product: { include: { unit: true } } } },
        payments: true,
      },
    });
    if (!purchase) throw new AppError('Purchase not found', 404);

    const subtotal = purchase.items.reduce(
      (sum, i) => sum + i.rate * i.quantity,
      0
    );
    sendSuccess(res, {
      invoiceNo:
        purchase.invoiceNo || `PUR-${String(purchase.id).padStart(6, '0')}`,
      date: purchase.date,
      branch: purchase.branch,
      supplier: purchase.supplier,
      items: purchase.items.map((i) => ({
        product: i.product.title,
        unit: i.product.unit?.shortName,
        quantity: i.quantity,
        rate: i.rate,
        discount: i.discount,
        total: i.rate * i.quantity - i.discount,
      })),
      subtotal,
      discount: purchase.discount,
      vat: purchase.vat,
      total: purchase.totalAmount,
      paid: purchase.totalAmount - purchase.dueAmount,
      due: purchase.dueAmount,
      paymentStatus: purchase.paymentStatus,
    });
  } catch (err) {
    next(err);
  }
};

export const getBarcodeData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { productIds, categoryId, brandId } = req.query;
    const ids = productIds
      ? String(productIds).split(',').map(Number).filter(Boolean)
      : undefined;
    const products = await prisma.product.findMany({
      where: {
        ...(ids && { id: { in: ids } }),
        ...(categoryId && { categoryId: parseInt(String(categoryId)) }),
        ...(brandId && { brandId: parseInt(String(brandId)) }),
        status: true,
      },
      select: {
        id: true,
        title: true,
        sku: true,
        barcode: true,
        sellingPrice: true,
        purchasePrice: true,
        category: { select: { name: true } },
        brand: { select: { name: true } },
      },
    });
    sendSuccess(res, products);
  } catch (err) {
    next(err);
  }
};
