import { Router } from 'express';
import { dailySummary, bestSellingProducts, customerDues, supplierDues, stockReport, profitReport, ledgerReport, smsLogReport } from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/daily-summary', dailySummary);
router.get('/best-selling-products', bestSellingProducts);
router.get('/customer-dues', customerDues);
router.get('/supplier-dues', supplierDues);
router.get('/stock', stockReport);
router.get('/profit', profitReport);
router.get('/ledger', ledgerReport);
router.get('/sms-log', smsLogReport);
export default router;
