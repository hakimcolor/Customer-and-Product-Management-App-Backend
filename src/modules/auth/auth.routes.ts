import { Router } from 'express';
import {
  login,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
  getLoginHistory,
} from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.validator';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.post('/logout', authenticate, logout);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.get('/me', authenticate, getMe);
router.put(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  changePassword
);
router.get('/login-history', authenticate, getLoginHistory);

export default router;
