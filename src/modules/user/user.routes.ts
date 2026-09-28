import { Router } from 'express';
import {
  getUsers, createUser, updateUser, deleteUser,
  approveUser, deactivateUser, getPendingUsers,
  getRoles, updateRolePermissions,
} from './user.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createUserSchema, updateUserSchema } from './user.validator';

const router = Router();
router.use(authenticate);

// User management (admin only)
router.get('/', authorize('ADMIN'), getUsers);
router.get('/pending', authorize('ADMIN'), getPendingUsers);
router.post('/', authorize('ADMIN'), validate(createUserSchema), createUser);
router.put('/:id', authorize('ADMIN'), validate(updateUserSchema), updateUser);
router.delete('/:id', authorize('ADMIN'), deleteUser);
router.put('/:id/approve', authorize('ADMIN'), approveUser);
router.put('/:id/deactivate', authorize('ADMIN'), deactivateUser);

// Role permissions (admin only)
router.get('/roles', authorize('ADMIN'), getRoles);
router.put('/roles/:role/permissions', authorize('ADMIN'), updateRolePermissions);

export default router;
