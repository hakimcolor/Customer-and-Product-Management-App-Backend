import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../utils/prisma';
import { sendSuccess, sendError } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';
import { getPagination, paginate } from '../../utils/pagination';

// GET /users — list all users (admin only)
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, role } = req.query;
    const { skip, take, page, limit } = getPagination(req);
    const where = {
      ...(status && { status: String(status) as any }),
      ...(role && { role: String(role) as any }),
    };
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          branch: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);
    sendSuccess(res, paginate(users, total, page, limit));
  } catch (err) {
    next(err);
  }
};

// POST /users — create user (admin only)
export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, name, role, branchId } = req.body;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      sendError(res, 'Email already registered', 409);
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashed, name, role, branchId, status: 'ACTIVE' },
      select: { id: true, email: true, name: true, role: true, status: true },
    });
    sendSuccess(res, user, 201);
  } catch (err) {
    next(err);
  }
};

// PUT /users/:id — update user info (admin only)
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const user = await prisma.user.update({
      where: { id },
      data: req.body,
      select: { id: true, email: true, name: true, role: true, status: true },
    });
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
};

// DELETE /users/:id — delete user (admin only)
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    await prisma.user.delete({ where: { id } });
    sendSuccess(res, { message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// PUT /users/:id/approve — approve pending user (admin only)
export const approveUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('User not found', 404);
    if (user.status !== 'PENDING') {
      sendError(res, 'User is not in pending status', 400);
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' },
      select: { id: true, email: true, name: true, role: true, status: true },
    });
    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
};

// PUT /users/:id/deactivate — deactivate user (admin only)
export const deactivateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const updated = await prisma.user.update({
      where: { id },
      data: { status: 'INACTIVE' },
      select: { id: true, email: true, name: true, role: true, status: true },
    });
    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
};

// GET /users/pending — list pending users (admin only)
export const getPendingUsers = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      where: { status: 'PENDING' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    sendSuccess(res, users);
  } catch (err) {
    next(err);
  }
};

// GET /roles
export const getRoles = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    sendSuccess(res, await prisma.rolePermission.findMany());
  } catch (err) {
    next(err);
  }
};

// PUT /roles/:role/permissions
export const updateRolePermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rp = await prisma.rolePermission.upsert({
      where: { roleName: req.params.role },
      update: { permissions: req.body.permissions },
      create: { roleName: req.params.role, permissions: req.body.permissions },
    });
    sendSuccess(res, rp);
  } catch (err) {
    next(err);
  }
};

// POST /users/:id/profile-picture
export const uploadProfilePicture = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const profileImage = (req as Request & { file?: Express.Multer.File }).file
      ?.path;
    if (!profileImage) throw new AppError('No image uploaded', 400);
    sendSuccess(
      res,
      await prisma.user.update({
        where: { id },
        data: { profileImage },
        select: { id: true, name: true, profileImage: true },
      })
    );
  } catch (err) {
    next(err);
  }
};
