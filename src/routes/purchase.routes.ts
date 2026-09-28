import { Router } from 'express';
import { getPurchases, createPurchase, getPurchase, makePurchasePayment } from '../controllers/purchase.controller';
import { returnPurchase } from '../controllers/return.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createPurchaseSchema, paymentSchema } from '../validators/purchase.validator';

const router = Router();
router.use(authenticate);
router.get('/', getPurchases);
router.post('/', validate(createPurchaseSchema), createPurchase);
router.get('/:id', getPurchase);
router.put('/:id/payment', validate(paymentSchema), makePurchasePayment);
router.post('/:id/return', returnPurchase);
export default router;
