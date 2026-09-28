import { Router } from 'express';
import { login, changePassword } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { loginSchema, changePasswordSchema } from '../validators/auth.validator';

const router = Router();
router.post('/login', validate(loginSchema), login);
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);
export default router;
