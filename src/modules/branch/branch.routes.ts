import { Router } from 'express';
import {
  getBranches,
  createBranch,
  getBranch,
  updateBranch,
  deleteBranch,
} from './branch.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', getBranches);
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), createBranch);
router.get('/:id', getBranch);
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN'), updateBranch);
router.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN'), deleteBranch);
export default router;
