import { Router } from 'express';
import { login, changePassword, getMe } from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { loginSchema, changePasswordSchema } from './auth.validator';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.get('/me', authenticate, getMe);
router.put('/change-password', authenticate, validate(changePasswordSchema), changePassword);

export default router;
