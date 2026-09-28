import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../utils/prisma';
import { sendSuccess, sendError } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }
    if (user.status === 'PENDING') {
      sendError(res, 'Your account is pending admin approval', 403);
      return;
    }
    if (user.status === 'INACTIVE') {
      sendError(res, 'Your account has been deactivated', 403);
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, status: user.status },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    sendSuccess(res, {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new AppError('User not found', 404);

    if (!(await bcrypt.compare(oldPassword, user.password))) {
      sendError(res, 'Old password is incorrect', 400);
      return;
    }
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    sendSuccess(res, { message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, role: true, status: true, branch: true },
    });
    if (!user) throw new AppError('User not found', 404);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
};
