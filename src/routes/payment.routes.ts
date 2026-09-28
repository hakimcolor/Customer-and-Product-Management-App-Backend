import { Router } from 'express';
import { getPayments, customerPayment, supplierPayment } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', getPayments);
router.post('/customer', customerPayment);
router.post('/supplier', supplierPayment);
export default router;
