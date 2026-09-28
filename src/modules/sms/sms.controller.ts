import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess } from '../../utils/response';
import { getPagination, paginate } from '../../utils/pagination';

// Stub: replace with real SMS provider (e.g. SSL Wireless, Twilio)
const sendSMSProvider = async (_to: string, _message: string): Promise<boolean> => {
  // TODO: integrate SMS gateway here
  return true;
};

export const sendSMS = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { to, message } = req.body;
    const sentStatus = await sendSMSProvider(to, message);
    const log = await prisma.sMSLog.create({ data: { to, message, sentStatus } });
    sendSuccess(res, log, 201);
  } catch (err) { next(err); }
};

export const getSMSLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { skip, take, page, limit } = getPagination(req);
    const [data, total] = await Promise.all([
      prisma.sMSLog.findMany({ skip, take, orderBy: { date: 'desc' } }),
      prisma.sMSLog.count(),
    ]);
    sendSuccess(res, paginate(data, total, page, limit));
  } catch (err) { next(err); }
};
