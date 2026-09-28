import { Router } from 'express';
import {
  login,
  changePassword,
  getMe,
  logout,
  getLoginHistory,
} from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { loginSchema, changePasswordSchema } from './auth.validator';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.put(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  changePassword
);
router.get('/login-history', authenticate, getLoginHistory);

export default router;
