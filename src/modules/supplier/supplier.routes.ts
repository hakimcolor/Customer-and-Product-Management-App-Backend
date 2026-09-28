import { Router } from 'express';
import {
  getSuppliers,
  createSupplier,
  getSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierLedger,
  getSupplierStatement,
} from './supplier.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', getSuppliers);
router.post('/', createSupplier);
router.get('/:id', getSupplier);
router.put('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);
router.get('/:id/ledger', getSupplierLedger);
router.get('/:id/statement', getSupplierStatement);
export default router;
