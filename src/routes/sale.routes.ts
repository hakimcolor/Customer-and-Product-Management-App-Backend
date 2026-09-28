import { Router } from 'express';
import { getSales, createSale, getSale, makeSalePayment } from '../controllers/sale.controller';
import { returnSale } from '../controllers/return.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createSaleSchema, paymentSchema } from '../validators/sale.validator';

const router = Router();
router.use(authenticate);
router.get('/', getSales);
router.post('/', validate(createSaleSchema), createSale);
router.get('/:id', getSale);
router.put('/:id/payment', validate(paymentSchema), makeSalePayment);
router.post('/:id/return', returnSale);
export default router;
