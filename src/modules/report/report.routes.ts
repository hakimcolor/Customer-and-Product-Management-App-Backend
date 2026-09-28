import { Router } from 'express';
import {
  dailySummary,
  dashboardStats,
  salesReport,
  purchasesReport,
  bestSellingProducts,
  customerDues,
  supplierDues,
  stockReport,
  profitReport,
  ledgerReport,
  expenseReport,
} from './report.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/dashboard', dashboardStats);
router.get('/daily-summary', dailySummary);
router.get('/sales', salesReport);
router.get('/purchases', purchasesReport);
router.get('/best-selling', bestSellingProducts);
router.get('/customer-dues', customerDues);
router.get('/supplier-dues', supplierDues);
router.get('/stock', stockReport);
router.get('/profit', profitReport);
router.get('/ledger', ledgerReport);
router.get('/expenses', expenseReport);
export default router;
