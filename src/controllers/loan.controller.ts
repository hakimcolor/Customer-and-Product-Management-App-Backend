import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getLoans = async (_req: Request, res: Response): Promise<void> => {
  res.json(await prisma.loan.findMany({ orderBy: { date: 'desc' } }));
};

export const createLoan = async (req: Request, res: Response): Promise<void> => {
  res.status(201).json(await prisma.loan.create({ data: req.body }));
};

export const updateLoan = async (req: Request, res: Response): Promise<void> => {
  res.json(await prisma.loan.update({ where: { id: parseInt(req.params.id) }, data: req.body }));
};

export const getCapital = async (_req: Request, res: Response): Promise<void> => {
  res.json(await prisma.capital.findMany());
};

export const upsertCapital = async (req: Request, res: Response): Promise<void> => {
  res.status(201).json(await prisma.capital.create({ data: req.body }));
};
