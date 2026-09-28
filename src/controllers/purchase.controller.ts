import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getPurchases = async (req: Request, res: Response): Promise<void> => {
  const { supplierId, startDate, endDate } = req.query;
  const purchases = await prisma.purchase.findMany({
    where: {
      ...(supplierId && { supplierId: parseInt(String(supplierId)) }),
      ...(startDate && endDate && { date: { gte: new Date(String(startDate)), lte: new Date(String(endDate)) } }),
    },
    include: { supplier: true, branch: true, items: { include: { product: true } } },
    orderBy: { date: 'desc' },
  });
  res.json(purchases);
};

export const createPurchase = async (req: Request, res: Response): Promise<void> => {
  const { supplierId, branchId, items, totalAmount, dueAmount, paymentStatus } = req.body;
  const purchase = await prisma.$transaction(async (tx) => {
    const p = await tx.purchase.create({
      data: { supplierId, branchId, totalAmount, dueAmount, paymentStatus, items: { create: items } },
      include: { items: true },
    });
    for (const item of items) {
      await tx.stock.upsert({
        where: { productId_branchId: { productId: item.productId, branchId } },
        update: { quantity: { increment: item.quantity } },
        create: { productId: item.productId, branchId, quantity: item.quantity, openingStock: 0, onStock: item.quantity },
      });
    }
    return p;
  });
  res.status(201).json(purchase);
};

export const getPurchase = async (req: Request, res: Response): Promise<void> => {
  const p = await prisma.purchase.findUnique({
    where: { id: parseInt(req.params.id) },
    include: { supplier: true, items: { include: { product: true } }, payments: true },
  });
  if (!p) { res.status(404).json({ message: 'Purchase not found' }); return; }
  res.json(p);
};

export const makePurchasePayment = async (req: Request, res: Response): Promise<void> => {
  const { amount, paymentType } = req.body;
  const purchaseId = parseInt(req.params.id);
  const purchase = await prisma.purchase.findUnique({ where: { id: purchaseId } });
  if (!purchase) { res.status(404).json({ message: 'Not found' }); return; }
  const newDue = purchase.dueAmount - amount;
  const [payment] = await prisma.$transaction([
    prisma.payment.create({ data: { purchaseId, supplierId: purchase.supplierId, amount, paymentType } }),
    prisma.purchase.update({
      where: { id: purchaseId },
      data: { dueAmount: newDue, paymentStatus: newDue <= 0 ? 'PAID' : 'PARTIAL' },
    }),
  ]);
  res.json(payment);
};
