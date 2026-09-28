import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  res.json(await prisma.category.findMany());
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  res.status(201).json(await prisma.category.create({ data: req.body }));
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  res.json(await prisma.category.update({ where: { id: parseInt(req.params.id) }, data: req.body }));
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  await prisma.category.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ message: 'Category deleted' });
};

export const getBrands = async (_req: Request, res: Response): Promise<void> => {
  res.json(await prisma.brand.findMany());
};

export const createBrand = async (req: Request, res: Response): Promise<void> => {
  res.status(201).json(await prisma.brand.create({ data: req.body }));
};

export const updateBrand = async (req: Request, res: Response): Promise<void> => {
  res.json(await prisma.brand.update({ where: { id: parseInt(req.params.id) }, data: req.body }));
};

export const deleteBrand = async (req: Request, res: Response): Promise<void> => {
  await prisma.brand.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ message: 'Brand deleted' });
};
