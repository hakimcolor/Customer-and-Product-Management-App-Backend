import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';

// Simple CSV builder
const toCSV = (rows: Record<string, unknown>[]): string => {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const v = row[h];
          const str = v === null || v === undefined ? '' : String(v);
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(',')
    ),
  ];
  return lines.join('\n');
};

const sendCSV = (
  res: Response,
  filename: string,
  data: Record<string, unknown>[]
): void => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(toCSV(data));
};

export const exportCustomers = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { name: 'asc' },
    });
    sendCSV(
      res,
      'customers.csv',
      customers.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        address: c.address,
        company: c.company,
        openingBalance: c.openingBalance,
        balance: c.balance,
        dues: c.dues,
        status: c.status,
      }))
    );
  } catch (err) {
    next(err);
  }
};

export const exportSuppliers = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' },
    });
    sendCSV(
      res,
      'suppliers.csv',
      suppliers.map((s) => ({
        id: s.id,
        name: s.name,
        phone: s.phone,
        email: s.email,
        address: s.address,
        company: s.company,
        openingBalance: s.openingBalance,
        balance: s.balance,
        dues: s.dues,
        status: s.status,
      }))
    );
  } catch (err) {
    next(err);
  }
};

export const exportProducts = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true, brand: true, unit: true },
      orderBy: { title: 'asc' },
    });
    sendCSV(
      res,
      'products.csv',
      products.map((p) => ({
        id: p.id,
        title: p.title,
        sku: p.sku,
        barcode: p.barcode,
        category: p.category?.name,
        brand: p.brand?.name,
        unit: p.unit?.shortName,
        purchasePrice: p.purchasePrice,
        wholesalePrice: p.wholesalePrice,
        sellingPrice: p.sellingPrice,
        vat: p.vat,
        alertQuantity: p.alertQuantity,
        status: p.status,
      }))
    );
  } catch (err) {
    next(err);
  }
};

export const exportSales = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate, branchId } = req.query;
    const sales = await prisma.sale.findMany({
      where: {
        ...(startDate &&
          endDate && {
            date: {
              gte: new Date(String(startDate)),
              lte: new Date(String(endDate)),
            },
          }),
        ...(branchId && { branchId: parseInt(String(branchId)) }),
      },
      include: { customer: true, branch: true },
      orderBy: { date: 'desc' },
    });
    sendCSV(
      res,
      'sales.csv',
      sales.map((s) => ({
        id: s.id,
        invoiceNo: s.invoiceNo,
        date: s.date.toISOString(),
        customer: s.customer?.name,
        branch: s.branch.name,
        totalAmount: s.totalAmount,
        discount: s.discount,
        dueAmount: s.dueAmount,
        paymentStatus: s.paymentStatus,
      }))
    );
  } catch (err) {
    next(err);
  }
};

export const exportPurchases = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate, branchId } = req.query;
    const purchases = await prisma.purchase.findMany({
      where: {
        ...(startDate &&
          endDate && {
            date: {
              gte: new Date(String(startDate)),
              lte: new Date(String(endDate)),
            },
          }),
        ...(branchId && { branchId: parseInt(String(branchId)) }),
      },
      include: { supplier: true, branch: true },
      orderBy: { date: 'desc' },
    });
    sendCSV(
      res,
      'purchases.csv',
      purchases.map((p) => ({
        id: p.id,
        invoiceNo: p.invoiceNo,
        date: p.date.toISOString(),
        supplier: p.supplier.name,
        branch: p.branch.name,
        totalAmount: p.totalAmount,
        dueAmount: p.dueAmount,
        paymentStatus: p.paymentStatus,
      }))
    );
  } catch (err) {
    next(err);
  }
};

export const exportStockReport = async (
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
      orderBy: { product: { title: 'asc' } },
    });
    sendCSV(
      res,
      'stock_report.csv',
      stocks.map((s) => ({
        product: s.product.title,
        sku: s.product.sku,
        barcode: s.product.barcode,
        category: s.product.category?.name,
        brand: s.product.brand?.name,
        branch: s.branch.name,
        quantity: s.quantity,
        openingStock: s.openingStock,
        purchasePrice: s.product.purchasePrice,
        sellingPrice: s.product.sellingPrice,
        stockValue: s.quantity * s.product.purchasePrice,
      }))
    );
  } catch (err) {
    next(err);
  }
};

export const exportLedger = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { customerId, supplierId, startDate, endDate } = req.query;
    const ledger = await prisma.ledger.findMany({
      where: {
        ...(customerId && { customerId: parseInt(String(customerId)) }),
        ...(supplierId && { supplierId: parseInt(String(supplierId)) }),
        ...(startDate &&
          endDate && {
            date: {
              gte: new Date(String(startDate)),
              lte: new Date(String(endDate)),
            },
          }),
      },
      include: { customer: true, supplier: true },
      orderBy: { date: 'asc' },
    });
    sendCSV(
      res,
      'ledger.csv',
      ledger.map((e) => ({
        date: e.date.toISOString(),
        type: e.type,
        customer: e.customer?.name,
        supplier: e.supplier?.name,
        amount: e.amount,
        balance: e.balance,
        description: e.description,
      }))
    );
  } catch (err) {
    next(err);
  }
};
