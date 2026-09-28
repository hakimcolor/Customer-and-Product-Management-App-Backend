import { Router } from 'express';
import { getSuppliers, createSupplier, getSupplier, updateSupplier, getSupplierLedger } from '../controllers/supplier.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', getSuppliers);
router.post('/', createSupplier);
router.get('/:id', getSupplier);
router.put('/:id', updateSupplier);
router.get('/:id/ledger', getSupplierLedger);
export default router;
