import { Router } from 'express';
import {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
} from './expense.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import multer from 'multer';

const upload = multer({ dest: 'uploads/vouchers/' });
const router = Router();
router.use(authenticate);
router.get('/', getExpenses);
router.get('/:id', getExpense);
router.post(
  '/',
  authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'),
  upload.single('voucher'),
  createExpense
);
router.put('/:id', authorize('ADMIN', 'ACCOUNTANT'), updateExpense);
router.delete('/:id', authorize('ADMIN'), deleteExpense);
export default router;
