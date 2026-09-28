import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getPayments = async (_req: Request, res: Response): Promise<void> => {
  res.json(await prisma.payment.findMany({ orderBy: { date: 'desc' } }));
};

export const customerPayment = async (req: Request, res: Response): Promise<void> => {
  const { customerId, amount, paymentType } = req.body;
  const payment = await prisma.payment.create({ data: { customerId, amount, paymentType } });
  await prisma.customer.update({ where: { id: customerId }, data: { dues: { decrement: amount } } });
  res.status(201).json(payment);
};

export const supplierPayment = async (req: Request, res: Response): Promise<void> => {
  const { supplierId, amount, paymentType } = req.body;
  const payment = await prisma.payment.create({ data: { supplierId, amount, paymentType } });
  await prisma.supplier.update({ where: { id: supplierId }, data: { dues: { decrement: amount } } });
  res.status(201).json(payment);
};
