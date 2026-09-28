import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess } from '../../utils/response';
import { getPagination, paginate } from '../../utils/pagination';

// Stub: replace with real SMS provider (SSL Wireless, Twilio, etc.)
const sendSMSProvider = async (
  _to: string,
  _message: string
): Promise<{ success: boolean; response: string }> => {
  // TODO: integrate SMS gateway
  // const provider = process.env.SMS_PROVIDER; // 'twilio' | 'ssl_wireless'
  return { success: true, response: 'SENT' };
};

export const sendSMS = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { to, message } = req.body;
    const result = await sendSMSProvider(to, message);
    const log = await prisma.sMSLog.create({
      data: {
        to,
        message,
        sentStatus: result.success,
        providerResp: result.response,
        sentBy: 'system',
      },
    });
    sendSuccess(res, log, 201);
  } catch (err) {
    next(err);
  }
};

export const bulkSMS = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { recipients, message } = req.body as {
      recipients: string[];
      message: string;
    };
    const logs = await Promise.all(
      recipients.map(async (to) => {
        const result = await sendSMSProvider(to, message);
        return prisma.sMSLog.create({
          data: {
            to,
            message,
            sentStatus: result.success,
            providerResp: result.response,
          },
        });
      })
    );
    sendSuccess(res, { sent: logs.length, logs }, 201);
  } catch (err) {
    next(err);
  }
};

export const getSMSLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { skip, take, page, limit } = getPagination(req);
    const [data, total] = await Promise.all([
      prisma.sMSLog.findMany({ skip, take, orderBy: { date: 'desc' } }),
      prisma.sMSLog.count(),
    ]);
    sendSuccess(res, paginate(data, total, page, limit));
  } catch (err) {
    next(err);
  }
};
