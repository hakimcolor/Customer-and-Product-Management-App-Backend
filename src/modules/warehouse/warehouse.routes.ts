import { Router } from 'express';
import {
  getWarehouses,
  createWarehouse,
  getWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from './warehouse.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', getWarehouses);
router.post('/', authorize('ADMIN'), createWarehouse);
router.get('/:id', getWarehouse);
router.put('/:id', authorize('ADMIN'), updateWarehouse);
router.delete('/:id', authorize('ADMIN'), deleteWarehouse);
export default router;
