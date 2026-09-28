import { Router } from 'express';
import {
  getCustomers,
  createCustomer,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerLedger,
  getCustomerStatement,
} from './customer.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', getCustomers);
router.post('/', createCustomer);
router.get('/:id', getCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);
router.get('/:id/ledger', getCustomerLedger);
router.get('/:id/statement', getCustomerStatement);
export default router;
