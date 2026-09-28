import { Router } from 'express';
import {
  sendSMS,
  bulkSMS,
  getSMSLogs,
  sendDueReminders,
} from './sms.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.post('/send', authorize('ADMIN', 'MANAGER'), sendSMS);
router.post('/bulk', authorize('ADMIN', 'MANAGER'), bulkSMS);
router.post(
  '/due-reminders',
  authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'),
  sendDueReminders
);
router.get('/logs', getSMSLogs);
export default router;
