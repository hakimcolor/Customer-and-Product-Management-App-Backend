import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth.middleware';
import { getPagination, paginate } from '../../utils/pagination';

export const getNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { skip, take, page, limit } = getPagination(req as Request);
    const where = {
      OR: [{ userId: req.user!.id }, { userId: null }],
    };
    const [data, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);
    sendSuccess(res, paginate(data, total, page, limit));
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await prisma.notification.update({
      where: { id: parseInt(req.params.id) },
      data: { isRead: true },
    });
    sendSuccess(res, { message: 'Marked as read' });
  } catch (err) {
    next(err);
  }
};

export const markAllAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await prisma.notification.updateMany({
      where: {
        OR: [{ userId: req.user!.id }, { userId: null }],
        isRead: false,
      },
      data: { isRead: true },
    });
    sendSuccess(res, { message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

export const createNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    sendSuccess(res, await prisma.notification.create({ data: req.body }), 201);
  } catch (err) {
    next(err);
  }
};
