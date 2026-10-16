import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updateMe,
  sendRegisterCode,
  sendForgotPasswordCode,
  resetPasswordWithCode,
  getTelegramStatus,
  createTelegramLink,
  unlinkTelegram,
} from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/send-register-code', authRateLimiter, sendRegisterCode);
router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.post('/forgot-password', authRateLimiter, sendForgotPasswordCode);
router.post('/reset-password', authRateLimiter, resetPasswordWithCode);
router.get('/me', authenticateJWT, getMe);
router.patch('/me', authenticateJWT, updateMe);

// Client Telegram Notifications
router.get('/me/telegram-status', authenticateJWT, getTelegramStatus);
router.post('/me/telegram-link', authenticateJWT, createTelegramLink);
router.post('/me/telegram-unlink', authenticateJWT, unlinkTelegram);

export default router;
