import { Router } from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  approveUser,
  deactivateUser,
  getPendingUsers,
  getRoles,
  updateRolePermissions,
  uploadProfilePicture,
} from './user.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createUserSchema, updateUserSchema } from './user.validator';
import { profileUpload } from '../../utils/upload';

const router = Router();
router.use(authenticate);

router.get('/', authorize('ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER'), getUsers);
router.get('/pending', authorize('ADMIN', 'SUPER_ADMIN'), getPendingUsers);
router.post(
  '/',
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(createUserSchema),
  createUser
);
router.put(
  '/:id',
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(updateUserSchema),
  updateUser
);
router.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN'), deleteUser);
router.put('/:id/approve', authorize('ADMIN', 'SUPER_ADMIN'), approveUser);
router.put(
  '/:id/deactivate',
  authorize('ADMIN', 'SUPER_ADMIN'),
  deactivateUser
);
router.post(
  '/:id/profile-picture',
  authorize('ADMIN', 'SUPER_ADMIN'),
  profileUpload.single('image'),
  uploadProfilePicture
);

router.get('/roles', authorize('ADMIN', 'SUPER_ADMIN'), getRoles);
router.put(
  '/roles/:role/permissions',
  authorize('ADMIN', 'SUPER_ADMIN'),
  updateRolePermissions
);

export default router;
