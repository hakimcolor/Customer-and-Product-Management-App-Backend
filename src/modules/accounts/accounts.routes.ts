import { Router } from 'express';
import {
  getAccounts,
  createAccount,
  getAccount,
  updateAccount,
  deleteAccount,
  getTransactions,
  deposit,
  withdraw,
  transfer,
  getAccountStatement,
} from './accounts.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', getAccounts);
router.post('/', authorize('ADMIN', 'ACCOUNTANT'), createAccount);
router.get('/transactions', getTransactions);
router.post('/deposit', authorize('ADMIN', 'ACCOUNTANT', 'CASHIER'), deposit);
router.post('/withdraw', authorize('ADMIN', 'ACCOUNTANT', 'CASHIER'), withdraw);
router.post('/transfer', authorize('ADMIN', 'ACCOUNTANT'), transfer);
router.get('/:id', getAccount);
router.put('/:id', authorize('ADMIN', 'ACCOUNTANT'), updateAccount);
router.delete('/:id', authorize('ADMIN'), deleteAccount);
router.get('/:id/statement', getAccountStatement);
export default router;
