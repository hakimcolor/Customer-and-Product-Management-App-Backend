import { Router } from 'express';
import {
  getSaleInvoice,
  getPurchaseInvoice,
  getBarcodeData,
} from './print.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/invoice/sale/:saleId', getSaleInvoice);
router.get('/invoice/purchase/:purchaseId', getPurchaseInvoice);
router.get('/barcode', getBarcodeData);
export default router;
