import { Router } from 'express';
import { getAuditLogs } from './audit.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'));
router.get('/', getAuditLogs);
export default router;
