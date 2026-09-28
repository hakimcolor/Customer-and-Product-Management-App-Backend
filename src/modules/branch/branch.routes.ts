import { Router } from 'express';
import { getBranches, createBranch, updateBranch, deleteBranch } from './branch.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { branchSchema } from './branch.validator';

const router = Router();
router.use(authenticate);
router.get('/', getBranches);
router.post('/', authorize('ADMIN'), validate(branchSchema), createBranch);
router.put('/:id', authorize('ADMIN'), validate(branchSchema), updateBranch);
router.delete('/:id', authorize('ADMIN'), deleteBranch);
export default router;
