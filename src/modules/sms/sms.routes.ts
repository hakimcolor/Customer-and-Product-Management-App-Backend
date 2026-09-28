import { Router } from 'express';
import { sendSMS, bulkSMS, getSMSLogs } from './sms.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.post('/send', authorize('ADMIN', 'MANAGER'), sendSMS);
router.post('/bulk', authorize('ADMIN', 'MANAGER'), bulkSMS);
router.get('/logs', getSMSLogs);
export default router;
