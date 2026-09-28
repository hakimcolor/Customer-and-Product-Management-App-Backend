import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';

export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, branchId: true } });
  res.json(users);
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password, name, role, branchId } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, password: hashed, name, role, branchId } });
    res.status(201).json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch {
    res.status(400).json({ message: 'Email already exists or invalid data' });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, role, branchId } = req.body;
  const user = await prisma.user.update({ where: { id: parseInt(id) }, data: { name, role, branchId } });
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  await prisma.user.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ message: 'User deleted' });
};

export const getRoles = async (_req: Request, res: Response): Promise<void> => {
  const roles = await prisma.rolePermission.findMany();
  res.json(roles);
};

export const updateRolePermissions = async (req: Request, res: Response): Promise<void> => {
  const { role } = req.params;
  const { permissions } = req.body;
  const rp = await prisma.rolePermission.upsert({
    where: { roleName: role },
    update: { permissions },
    create: { roleName: role, permissions },
  });
  res.json(rp);
};
