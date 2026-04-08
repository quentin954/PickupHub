import { Router } from 'express';
import { register, login, refresh, logout } from '../controllers/auth.controller';
import { authRateLimiter } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validate.middleware';
import { registerSchema, loginSchema, refreshSchema, logoutSchema } from '../dto/auth.dto';

const router = Router();

router.post('/register', validate({ body: registerSchema }), register);
router.post('/login', authRateLimiter, validate({ body: loginSchema }), login);
router.post('/refresh', validate({ body: refreshSchema }), refresh);
router.post('/logout', validate({ body: logoutSchema }), logout);

export default router;