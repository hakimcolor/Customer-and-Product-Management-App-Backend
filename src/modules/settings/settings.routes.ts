import { Router } from 'express';
import {
  getSettings,
  upsertSetting,
  bulkUpsertSettings,
  deleteSetting,
  uploadCompanyLogo,
} from './settings.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { companyLogoUpload } from '../../utils/upload';

const router = Router();
router.use(authenticate);
router.get('/', getSettings);
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), upsertSetting);
router.post('/bulk', authorize('ADMIN', 'SUPER_ADMIN'), bulkUpsertSettings);
router.post(
  '/upload-logo',
  authorize('ADMIN', 'SUPER_ADMIN'),
  companyLogoUpload.single('logo'),
  uploadCompanyLogo
);
router.delete('/:key', authorize('ADMIN', 'SUPER_ADMIN'), deleteSetting);
export default router;
