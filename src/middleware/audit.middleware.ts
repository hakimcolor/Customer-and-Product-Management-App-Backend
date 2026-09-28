import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from './auth.middleware';

type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'APPROVE'
  | 'REJECT';

export const auditLog =
  (module: string, action: AuditAction) =>
  async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (req.user?.id) {
        await prisma.auditLog.create({
          data: {
            userId: req.user.id,
            action,
            module,
            recordId: req.params.id || null,
            newValue: req.body || null,
            ip: req.ip,
            device: req.headers['user-agent']?.substring(0, 255),
          },
        });
      }
    } catch {
      // Audit log failure should never block the request
    }
    next();
  };
