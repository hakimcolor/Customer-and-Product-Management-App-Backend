import { Router } from 'express';
import { getPurchases, createPurchase, getPurchase, makePurchasePayment } from '../controllers/purchase.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', getPurchases);
router.post('/', createPurchase);
router.get('/:id', getPurchase);
router.put('/:id/payment', makePurchasePayment);
export default router;
