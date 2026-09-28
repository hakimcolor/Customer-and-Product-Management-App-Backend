import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { sendSuccess } from '../../utils/response';

export const getSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { group } = req.query;
    const settings = await prisma.systemSetting.findMany({
      where: group ? { group: String(group) } : undefined,
      orderBy: { key: 'asc' },
    });
    // Convert to key-value map grouped by group
    const grouped: Record<string, Record<string, string>> = {};
    for (const s of settings) {
      if (!grouped[s.group]) grouped[s.group] = {};
      grouped[s.group][s.key] = s.value;
    }
    sendSuccess(res, grouped);
  } catch (err) {
    next(err);
  }
};

export const upsertSetting = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { key, value, group } = req.body;
    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value, group: group || 'general' },
    });
    sendSuccess(res, setting);
  } catch (err) {
    next(err);
  }
};

export const bulkUpsertSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { settings, group } = req.body as {
      settings: Record<string, string>;
      group?: string;
    };
    const ops = Object.entries(settings).map(([key, value]) =>
      prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value, group: group || 'general' },
      })
    );
    await prisma.$transaction(ops);
    sendSuccess(res, { message: 'Settings saved' });
  } catch (err) {
    next(err);
  }
};

export const deleteSetting = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await prisma.systemSetting.delete({ where: { key: req.params.key } });
    sendSuccess(res, { message: 'Setting deleted' });
  } catch (err) {
    next(err);
  }
};

export const uploadCompanyLogo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { fileToUrl } = await import('../../utils/upload');
    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file) {
      res.status(400).json({ success: false, message: 'No image uploaded' });
      return;
    }
    const logoUrl = fileToUrl(file.path);
    await prisma.systemSetting.upsert({
      where: { key: 'company_logo' },
      update: { value: logoUrl },
      create: { key: 'company_logo', value: logoUrl, group: 'company' },
    });
    sendSuccess(res, { logo: logoUrl });
  } catch (err) {
    next(err);
  }
};
