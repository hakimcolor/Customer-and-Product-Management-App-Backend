import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../utils/prisma';
import { sendSuccess, sendError } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendEmail } from '../../utils/email';
import { generateResetToken, hashToken } from '../../utils/token';

// ── Login ─────────────────────────────────────────────────────
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { branch: true },
    });
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
    await prisma.auditLog.create({
      data: { userId: user.id, action: 'LOGIN', module: 'auth', ip, device },
    });

    const secret = process.env.JWT_SECRET as string;
    const exp = (process.env.JWT_EXPIRES_IN ||
      '7d') as `${number}${'s' | 'm' | 'h' | 'd' | 'w'}`;
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: exp }
    );

    sendSuccess(res, {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        branch: user.branch,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Logout ────────────────────────────────────────────────────
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

// ── Forgot Password ───────────────────────────────────────────
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    // Always return success to avoid email enumeration
    if (!user) {
      sendSuccess(res, {
        message: 'If that email exists, a reset link has been sent.',
      });
      return;
    }

    const rawToken = generateResetToken();
    const hashedToken = hashToken(rawToken);
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: hashedToken, resetTokenExp: expiry },
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${rawToken}`;
    await sendEmail(
      user.email,
      'Password Reset Request',
      `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>If you did not request this, ignore this email.</p>
    `
    );

    sendSuccess(res, {
      message: 'If that email exists, a reset link has been sent.',
    });
  } catch (err) {
    next(err);
  }
};

// ── Reset Password ────────────────────────────────────────────
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    const hashedToken = hashToken(token);
    const user = await prisma.user.findFirst({
      where: { resetToken: hashedToken, resetTokenExp: { gt: new Date() } },
    });
    if (!user) throw new AppError('Invalid or expired reset token', 400);

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, resetToken: null, resetTokenExp: null },
    });
    sendSuccess(res, { message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
};

// ── Change Password ───────────────────────────────────────────
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

// ── Get Me ────────────────────────────────────────────────────
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
        joiningDate: true,
      },
    });
    if (!user) throw new AppError('User not found', 404);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
};

// ── Login History ─────────────────────────────────────────────
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
