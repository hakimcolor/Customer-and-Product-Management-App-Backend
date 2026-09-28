import { Router } from 'express';
import { getSuppliers, createSupplier, getSupplier, updateSupplier, deleteSupplier, getSupplierLedger } from './supplier.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { supplierSchema } from './supplier.validator';

const router = Router();
router.use(authenticate);
router.get('/', getSuppliers);
router.post('/', validate(supplierSchema), createSupplier);
router.get('/:id', getSupplier);
router.put('/:id', validate(supplierSchema.partial()), updateSupplier);
router.delete('/:id', deleteSupplier);
router.get('/:id/ledger', getSupplierLedger);
export default router;
