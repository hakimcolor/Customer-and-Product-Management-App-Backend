import { Router } from 'express';
import { sendSMS, getSMSLogs } from '../controllers/sms.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.post('/send', sendSMS);
router.get('/logs', getSMSLogs);
export default router;
