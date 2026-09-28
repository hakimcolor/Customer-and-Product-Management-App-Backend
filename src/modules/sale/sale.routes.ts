import { Router } from 'express';
import {
  getSales,
  createSale,
  getSale,
  updateSale,
  makeSalePayment,
  returnSale,
  getSaleReturns,
} from './sale.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createSaleSchema, paymentSchema } from './sale.validator';

const router = Router();
router.use(authenticate);
router.get('/returns', getSaleReturns);
router.get('/', getSales);
router.post(
  '/',
  authorize('ADMIN', 'MANAGER', 'SALESMAN'),
  validate(createSaleSchema),
  createSale
);
router.get('/:id', getSale);
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateSale);
router.post(
  '/:id/payment',
  authorize('ADMIN', 'MANAGER', 'ACCOUNTANT', 'CASHIER'),
  validate(paymentSchema),
  makeSalePayment
);
router.post('/:id/return', authorize('ADMIN', 'MANAGER'), returnSale);
export default router;
