import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getSaleInvoice = async (req: Request, res: Response): Promise<void> => {
  const sale = await prisma.sale.findUnique({
    where: { id: parseInt(req.params.saleId) },
    include: {
      customer: true,
      branch: true,
      items: { include: { product: { include: { category: true, brand: true } } } },
      payments: true,
    },
  });
  if (!sale) { res.status(404).json({ message: 'Sale not found' }); return; }

  const subtotal = sale.items.reduce((sum, i) => sum + i.rate * i.quantity, 0);
  const totalDiscount = sale.items.reduce((sum, i) => sum + i.discount, 0) + sale.discount;
  const invoice = {
    invoiceNo: `INV-${sale.id.toString().padStart(6, '0')}`,
    date: sale.date,
    branch: sale.branch,
    customer: sale.customer,
    items: sale.items.map(i => ({
      product: i.product.title,
      barcode: i.product.barcode,
      quantity: i.quantity,
      rate: i.rate,
      discount: i.discount,
      total: i.rate * i.quantity - i.discount,
    })),
    subtotal,
    discount: totalDiscount,
    total: sale.totalAmount,
    paid: sale.totalAmount - sale.dueAmount,
    due: sale.dueAmount,
    paymentStatus: sale.paymentStatus,
  };
  res.json(invoice);
};

export const getBarcodeData = async (req: Request, res: Response): Promise<void> => {
  const { productIds } = req.query;
  const ids = String(productIds).split(',').map(Number).filter(Boolean);
  const products = await prisma.product.findMany({
    where: ids.length ? { id: { in: ids } } : undefined,
    select: { id: true, title: true, barcode: true, sellingPrice: true },
  });
  res.json(products);
};
