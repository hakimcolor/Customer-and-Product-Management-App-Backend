import { Router } from 'express';
import { getSales, createSale, getSale, makeSalePayment, returnSale } from './sale.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createSaleSchema, paymentSchema, returnSchema } from './sale.validator';

const router = Router();
router.use(authenticate);
router.get('/', getSales);
router.post('/', authorize('ADMIN', 'MANAGER'), validate(createSaleSchema), createSale);
router.get('/:id', getSale);
router.put('/:id/payment', authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'), validate(paymentSchema), makeSalePayment);
router.post('/:id/return', authorize('ADMIN', 'MANAGER'), validate(returnSchema), returnSale);
export default router;
