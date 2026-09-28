import { Router } from 'express';
import { getPayments, customerPayment, supplierPayment } from './payment.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { customerPaymentSchema, supplierPaymentSchema } from './payment.validator';

const router = Router();
router.use(authenticate);
router.get('/', getPayments);
router.post('/customer', authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'), validate(customerPaymentSchema), customerPayment);
router.post('/supplier', authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'), validate(supplierPaymentSchema), supplierPayment);
export default router;
