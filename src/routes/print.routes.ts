import { Router } from 'express';
import { getSaleInvoice, getBarcodeData } from '../controllers/print.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/invoice/:saleId', getSaleInvoice);
router.get('/barcodes', getBarcodeData);
export default router;
