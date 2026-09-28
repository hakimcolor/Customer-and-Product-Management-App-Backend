import { Router } from 'express';
import { getLoans, createLoan, updateLoan, deleteLoan, getCapital, createCapital, updateCapital } from './loan.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { loanSchema, capitalSchema } from './loan.validator';

const router = Router();
router.use(authenticate, authorize('ADMIN', 'ACCOUNTANT'));
router.get('/loans', getLoans);
router.post('/loans', validate(loanSchema), createLoan);
router.put('/loans/:id', validate(loanSchema.partial()), updateLoan);
router.delete('/loans/:id', authorize('ADMIN'), deleteLoan);
router.get('/capital', getCapital);
router.post('/capital', validate(capitalSchema), createCapital);
router.put('/capital/:id', validate(capitalSchema.partial()), updateCapital);
export default router;
