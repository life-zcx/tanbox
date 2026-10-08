import { Router } from 'express';
import { register, login, getMe, updateMe } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.get('/me', authenticateJWT, getMe);
router.patch('/me', authenticateJWT, updateMe);

export default router;
