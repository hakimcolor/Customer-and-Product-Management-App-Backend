import { Router } from 'express';
import {
  getPurchases,
  createPurchase,
  getPurchase,
  updatePurchase,
  makePurchasePayment,
  returnPurchase,
  getPurchaseReturns,
} from './purchase.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createPurchaseSchema, paymentSchema } from './purchase.validator';

const router = Router();
router.use(authenticate);
router.get('/returns', getPurchaseReturns);
router.get('/', getPurchases);
router.post(
  '/',
  authorize('ADMIN', 'MANAGER', 'PURCHASE_MANAGER'),
  validate(createPurchaseSchema),
  createPurchase
);
router.get('/:id', getPurchase);
router.put('/:id', authorize('ADMIN', 'MANAGER'), updatePurchase);
router.post(
  '/:id/payment',
  authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'),
  validate(paymentSchema),
  makePurchasePayment
);
router.post('/:id/return', authorize('ADMIN', 'MANAGER'), returnPurchase);
export default router;
