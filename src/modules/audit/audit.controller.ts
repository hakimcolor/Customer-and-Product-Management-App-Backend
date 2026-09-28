import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess } from '../../utils/response';
import { getPagination, paginate } from '../../utils/pagination';

export const getAuditLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, module, action, startDate, endDate } = req.query;
    const { skip, take, page, limit } = getPagination(req);
    const where: Record<string, unknown> = {
      ...(userId && { userId: parseInt(String(userId)) }),
      ...(module && { module: String(module) }),
      ...(action && { action: String(action) as never }),
      ...(startDate &&
        endDate && {
          createdAt: {
            gte: new Date(String(startDate)),
            lte: new Date(String(endDate)),
          },
        }),
    };
    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);
    sendSuccess(res, paginate(data, total, page, limit));
  } catch (err) {
    next(err);
  }
};
