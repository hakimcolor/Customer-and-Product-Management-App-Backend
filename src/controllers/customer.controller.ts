import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { getPagination, paginatedResponse } from '../utils/pagination';

export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  const { search } = req.query;
  const { skip, take, page, limit } = getPagination(req);
  const where = search ? { OR: [{ name: { contains: String(search), mode: 'insensitive' as const } }, { phone: { contains: String(search) } }] } : undefined;
  const [customers, total] = await Promise.all([
    prisma.customer.findMany({ where, skip, take, orderBy: { name: 'asc' } }),
    prisma.customer.count({ where }),
  ]);
  res.json(paginatedResponse(customers, total, page, limit));
};

export const createCustomer = async (req: Request, res: Response): Promise<void> => {
  const customer = await prisma.customer.create({ data: req.body });
  res.status(201).json(customer);
};

export const getCustomer = async (req: Request, res: Response): Promise<void> => {
  const customer = await prisma.customer.findUnique({
    where: { id: parseInt(req.params.id) },
    include: { sales: true, payments: true },
  });
  if (!customer) { res.status(404).json({ message: 'Customer not found' }); return; }
  res.json(customer);
};

export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  const customer = await prisma.customer.update({ where: { id: parseInt(req.params.id) }, data: req.body });
  res.json(customer);
};

export const getCustomerLedger = async (req: Request, res: Response): Promise<void> => {
  const ledger = await prisma.ledger.findMany({ where: { customerId: parseInt(req.params.id) }, orderBy: { date: 'desc' } });
  res.json(ledger);
};
