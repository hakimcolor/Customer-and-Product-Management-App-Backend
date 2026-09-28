import { Router } from 'express';
import {
  searchProducts,
  holdSale,
  getHeldSales,
  posCheckout,
} from './pos.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/search', searchProducts); // product search
router.get('/held', getHeldSales); // held sales
router.post('/hold', holdSale); // hold a sale
router.post('/checkout', posCheckout); // quick checkout
export default router;
