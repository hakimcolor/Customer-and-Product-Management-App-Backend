import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';

export const getSaleInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: parseInt(req.params.saleId) },
      include: {
        customer: true,
        branch: true,
        items: { include: { product: { include: { category: true, brand: true } } } },
        payments: true,
      },
    });
    if (!sale) throw new AppError('Sale not found', 404);

    const subtotal = sale.items.reduce((sum, i) => sum + i.rate * i.quantity, 0);
    const itemDiscount = sale.items.reduce((sum, i) => sum + i.discount, 0);

    sendSuccess(res, {
      invoiceNo: `INV-${String(sale.id).padStart(6, '0')}`,
      date: sale.date,
      branch: sale.branch,
      customer: sale.customer,
      items: sale.items.map(i => ({
        product: i.product.title,
        barcode: i.product.barcode,
        category: i.product.category?.name,
        quantity: i.quantity,
        rate: i.rate,
        discount: i.discount,
        total: i.rate * i.quantity - i.discount,
      })),
      subtotal,
      itemDiscount,
      invoiceDiscount: sale.discount,
      total: sale.totalAmount,
      paid: sale.totalAmount - sale.dueAmount,
      due: sale.dueAmount,
      paymentStatus: sale.paymentStatus,
      payments: sale.payments,
    });
  } catch (err) { next(err); }
};

export const getBarcodeData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productIds } = req.query;
    const ids = productIds ? String(productIds).split(',').map(Number).filter(Boolean) : undefined;
    const products = await prisma.product.findMany({
      where: ids ? { id: { in: ids } } : undefined,
      select: { id: true, title: true, barcode: true, sellingPrice: true, category: true },
    });
    sendSuccess(res, products);
  } catch (err) { next(err); }
};
