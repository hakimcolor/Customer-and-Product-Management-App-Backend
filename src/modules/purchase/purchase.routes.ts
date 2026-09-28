import { Router } from 'express';
import { getPurchases, createPurchase, getPurchase, makePurchasePayment, returnPurchase } from './purchase.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createPurchaseSchema, paymentSchema, returnSchema } from './purchase.validator';

const router = Router();
router.use(authenticate);
router.get('/', getPurchases);
router.post('/', authorize('ADMIN', 'MANAGER'), validate(createPurchaseSchema), createPurchase);
router.get('/:id', getPurchase);
router.put('/:id/payment', authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'), validate(paymentSchema), makePurchasePayment);
router.post('/:id/return', authorize('ADMIN', 'MANAGER'), validate(returnSchema), returnPurchase);
export default router;
