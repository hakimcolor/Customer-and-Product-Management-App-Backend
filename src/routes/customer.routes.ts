import { Router } from 'express';
import { getCustomers, createCustomer, getCustomer, updateCustomer, getCustomerLedger } from '../controllers/customer.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', getCustomers);
router.post('/', createCustomer);
router.get('/:id', getCustomer);
router.put('/:id', updateCustomer);
router.get('/:id/ledger', getCustomerLedger);
export default router;
