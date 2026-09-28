import { Router } from 'express';
import {
  getLoans,
  createLoan,
  getLoan,
  updateLoan,
  deleteLoan,
  makeLoanPayment,
  getCapital,
  createCapital,
  updateCapital,
  capitalTransaction,
} from './loan.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { loanSchema, capitalSchema } from './loan.validator';

const router = Router();
router.use(authenticate, authorize('ADMIN', 'ACCOUNTANT'));
router.get('/loans', getLoans);
router.post('/loans', validate(loanSchema), createLoan);
router.get('/loans/:id', getLoan);
router.put('/loans/:id', validate(loanSchema.partial()), updateLoan);
router.delete('/loans/:id', authorize('ADMIN'), deleteLoan);
router.post('/loans/:id/payment', makeLoanPayment);
router.get('/capital', getCapital);
router.post('/capital', validate(capitalSchema), createCapital);
router.put('/capital/:id', validate(capitalSchema.partial()), updateCapital);
router.post('/capital/:id/transaction', capitalTransaction);
export default router;
