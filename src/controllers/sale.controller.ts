import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { getPagination, paginatedResponse } from '../utils/pagination';

export const getSales = async (req: Request, res: Response): Promise<void> => {
  const { customerId, startDate, endDate } = req.query;
  const { skip, take, page, limit } = getPagination(req);
  const where = {
    ...(customerId && { customerId: parseInt(String(customerId)) }),
    ...(startDate && endDate && { date: { gte: new Date(String(startDate)), lte: new Date(String(endDate)) } }),
  };
  const [sales, total] = await Promise.all([
    prisma.sale.findMany({ where, skip, take, include: { customer: true, branch: true, items: { include: { product: true } } }, orderBy: { date: 'desc' } }),
    prisma.sale.count({ where }),
  ]);
  res.json(paginatedResponse(sales, total, page, limit));
};

export const createSale = async (req: Request, res: Response): Promise<void> => {
  const { customerId, branchId, items, totalAmount, discount, dueAmount, paymentStatus } = req.body;
  const sale = await prisma.$transaction(async (tx) => {
    const s = await tx.sale.create({
      data: { customerId, branchId, totalAmount, discount, dueAmount, paymentStatus, items: { create: items } },
      include: { items: true },
    });
    for (const item of items) {
      await tx.stock.update({
        where: { productId_branchId: { productId: item.productId, branchId } },
        data: { quantity: { decrement: item.quantity } },
      });
    }
    return s;
  });
  res.status(201).json(sale);
};

export const getSale = async (req: Request, res: Response): Promise<void> => {
  const s = await prisma.sale.findUnique({
    where: { id: parseInt(req.params.id) },
    include: { customer: true, branch: true, items: { include: { product: true } }, payments: true },
  });
  if (!s) { res.status(404).json({ message: 'Sale not found' }); return; }
  res.json(s);
};

export const makeSalePayment = async (req: Request, res: Response): Promise<void> => {
  const { amount, paymentType } = req.body;
  const saleId = parseInt(req.params.id);
  const sale = await prisma.sale.findUnique({ where: { id: saleId } });
  if (!sale) { res.status(404).json({ message: 'Not found' }); return; }
  const newDue = sale.dueAmount - amount;
  const [payment] = await prisma.$transaction([
    prisma.payment.create({ data: { saleId, customerId: sale.customerId, amount, paymentType } }),
    prisma.sale.update({
      where: { id: saleId },
      data: { dueAmount: newDue, paymentStatus: newDue <= 0 ? 'PAID' : 'PARTIAL' },
    }),
  ]);
  res.json(payment);
};
