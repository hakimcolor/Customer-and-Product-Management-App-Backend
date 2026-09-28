import { Router } from 'express';
import {
  exportCustomers,
  exportSuppliers,
  exportProducts,
  exportSales,
  exportPurchases,
  exportStockReport,
  exportLedger,
} from './export.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();
router.use(
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT', 'BRANCH_MANAGER')
);
router.get('/customers', exportCustomers);
router.get('/suppliers', exportSuppliers);
router.get('/products', exportProducts);
router.get('/sales', exportSales);
router.get('/purchases', exportPurchases);
router.get('/stock', exportStockReport);
router.get('/ledger', exportLedger);
export default router;
