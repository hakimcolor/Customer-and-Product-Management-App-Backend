import { Router } from 'express';
import { getSales, createSale, getSale, makeSalePayment } from '../controllers/sale.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', getSales);
router.post('/', createSale);
router.get('/:id', getSale);
router.put('/:id/payment', makeSalePayment);
export default router;
