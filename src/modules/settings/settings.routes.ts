import { Router } from 'express';
import {
  getSettings,
  upsertSetting,
  bulkUpsertSettings,
  deleteSetting,
} from './settings.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', getSettings);
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), upsertSetting);
router.post('/bulk', authorize('ADMIN', 'SUPER_ADMIN'), bulkUpsertSettings);
router.delete('/:key', authorize('ADMIN', 'SUPER_ADMIN'), deleteSetting);
export default router;
