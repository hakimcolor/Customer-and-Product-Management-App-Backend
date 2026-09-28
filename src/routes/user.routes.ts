import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser, getRoles, updateRolePermissions } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', getUsers);
router.post('/', authorize('ADMIN'), createUser);
router.put('/:id', authorize('ADMIN'), updateUser);
router.delete('/:id', authorize('ADMIN'), deleteUser);
router.get('/roles', getRoles);
router.put('/roles/:role/permissions', authorize('ADMIN'), updateRolePermissions);
export default router;
