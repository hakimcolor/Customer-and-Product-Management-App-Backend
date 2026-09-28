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
  productSalesReport,
  damageReport,
  transferReport,
  cashFlowReport,
  monthlyChart,
  stockMovementHistory,
} from './report.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/dashboard', dashboardStats);
router.get('/daily-summary', dailySummary);
router.get('/sales', salesReport);
router.get('/purchases', purchasesReport);
router.get('/best-selling', bestSellingProducts);
router.get('/product-sales', productSalesReport);
router.get('/customer-dues', customerDues);
router.get('/supplier-dues', supplierDues);
router.get('/stock', stockReport);
router.get('/stock-movements', stockMovementHistory);
router.get('/damages', damageReport);
router.get('/transfers', transferReport);
router.get('/profit', profitReport);
router.get('/ledger', ledgerReport);
router.get('/expenses', expenseReport);
router.get('/cash-flow', cashFlowReport);
router.get('/monthly-chart', monthlyChart);
export default router;
