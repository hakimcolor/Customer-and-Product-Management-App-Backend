import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../utils/prisma';
import { sendSuccess, sendError } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    const ip = req.ip;
    const device = req.headers['user-agent']?.substring(0, 255);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      if (user)
        await prisma.loginHistory.create({
          data: { userId: user.id, ip, device, success: false },
        });
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

    await prisma.loginHistory.create({
      data: { userId: user.id, ip, device, success: true },
    });

    const secret = process.env.JWT_SECRET as string;
    const expiresIn = (process.env.JWT_EXPIRES_IN ||
      '7d') as `${number}${'s' | 'm' | 'h' | 'd' | 'w'}`;
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn }
    );

    sendSuccess(res, {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user?.id) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'LOGOUT',
          module: 'auth',
          ip: req.ip,
          device: req.headers['user-agent']?.substring(0, 255),
        },
      });
    }
    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

export const getLoginHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    sendSuccess(
      res,
      await prisma.loginHistory.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
    );
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new AppError('User not found', 404);
    if (!(await bcrypt.compare(oldPassword, user.password))) {
      sendError(res, 'Old password is incorrect', 400);
      return;
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(newPassword, 12) },
    });
    sendSuccess(res, { message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        branch: true,
        phone: true,
        profileImage: true,
      },
    });
    if (!user) throw new AppError('User not found', 404);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
};
