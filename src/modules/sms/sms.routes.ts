import { Router } from 'express';
import { sendSMS, getSMSLogs } from './sms.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { z } from 'zod';
import { validate } from '../../middleware/validate.middleware';

const smsSchema = z.object({ to: z.string().min(1), message: z.string().min(1) });
const router = Router();
router.use(authenticate);
router.post('/send', authorize('ADMIN', 'MANAGER'), validate(smsSchema), sendSMS);
router.get('/logs', getSMSLogs);
export default router;
