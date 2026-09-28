import { Router } from 'express';
import { getLoans, createLoan, updateLoan, getCapital, upsertCapital } from '../controllers/loan.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/loans', getLoans);
router.post('/loans', createLoan);
router.put('/loans/:id', updateLoan);
router.get('/capital', getCapital);
router.post('/capital', upsertCapital);
export default router;
