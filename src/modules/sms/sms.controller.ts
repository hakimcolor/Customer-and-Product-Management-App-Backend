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

export const sendDueReminders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { message, type = 'customer', minDue = 0 } = req.body;
    // Get customers or suppliers with dues above threshold
    let contacts: { phone: string | null; name: string; dues: number }[] = [];
    if (type === 'customer') {
      contacts = await prisma.customer.findMany({
        where: {
          dues: { gt: Number(minDue) },
          phone: { not: null },
          status: true,
        },
        select: { phone: true, name: true, dues: true },
      });
    } else {
      contacts = await prisma.supplier.findMany({
        where: {
          dues: { gt: Number(minDue) },
          phone: { not: null },
          status: true,
        },
        select: { phone: true, name: true, dues: true },
      });
    }
    const logs = await Promise.all(
      contacts
        .filter((c) => c.phone)
        .map(async (c) => {
          const smsText =
            message ||
            `Dear ${c.name}, your outstanding due is ${c.dues}. Please clear at your earliest. Thank you.`;
          const result = await sendSMSProvider(c.phone!, smsText);
          return prisma.sMSLog.create({
            data: {
              to: c.phone!,
              message: smsText,
              sentStatus: result.success,
              providerResp: result.response,
              sentBy: 'system',
            },
          });
        })
    );
    sendSuccess(res, { sent: logs.length, recipients: contacts.length }, 201);
  } catch (err) {
    next(err);
  }
};
