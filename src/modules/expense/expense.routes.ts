import { Router } from 'express';
import { getExpenses, createExpense, updateExpense, deleteExpense } from './expense.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { expenseSchema } from './expense.validator';
import multer from 'multer';

const upload = multer({ dest: 'uploads/vouchers/' });
const router = Router();
router.use(authenticate);
router.get('/', getExpenses);
router.post('/', authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'), upload.single('voucher'), validate(expenseSchema), createExpense);
router.put('/:id', authorize('ADMIN', 'ACCOUNTANT'), validate(expenseSchema.partial()), updateExpense);
router.delete('/:id', authorize('ADMIN'), deleteExpense);
export default router;
