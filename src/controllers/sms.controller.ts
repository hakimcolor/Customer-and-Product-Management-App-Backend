import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const sendSMS = async (req: Request, res: Response): Promise<void> => {
  const { to, message } = req.body;
  // Integrate with SMS provider here (e.g., Twilio, SSL Wireless)
  const log = await prisma.sMSLog.create({ data: { to, message, sentStatus: true } });
  res.status(201).json({ message: 'SMS sent', log });
};

export const getSMSLogs = async (_req: Request, res: Response): Promise<void> => {
  res.json(await prisma.sMSLog.findMany({ orderBy: { date: 'desc' } }));
};
