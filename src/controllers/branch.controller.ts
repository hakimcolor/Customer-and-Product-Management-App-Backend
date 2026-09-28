import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getBranches = async (_req: Request, res: Response): Promise<void> => {
  const branches = await prisma.branch.findMany();
  res.json(branches);
};

export const createBranch = async (req: Request, res: Response): Promise<void> => {
  const branch = await prisma.branch.create({ data: req.body });
  res.status(201).json(branch);
};

export const updateBranch = async (req: Request, res: Response): Promise<void> => {
  const branch = await prisma.branch.update({ where: { id: parseInt(req.params.id) }, data: req.body });
  res.json(branch);
};

export const deleteBranch = async (req: Request, res: Response): Promise<void> => {
  await prisma.branch.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ message: 'Branch deleted' });
};
