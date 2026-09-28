import { Router } from 'express';
import { getExpenses, createExpense } from '../controllers/expense.controller';
import { authenticate } from '../middleware/auth.middleware';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });
const router = Router();
router.use(authenticate);
router.get('/', getExpenses);
router.post('/', upload.single('voucher'), createExpense);
export default router;
