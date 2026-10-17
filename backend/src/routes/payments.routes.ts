import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import {
  initPayment,
  freedomCheckWebhook,
  freedomResultWebhook,
  getMyPayments,
  getUserBalance,
} from '../controllers/payments.controller';

const router = Router();

// 1. Client payment initialization (authenticated)
router.post('/init', authenticateJWT, initPayment);

// 2. Freedom Pay Pre-authorization Check (server-to-server webhook, both GET and POST, with and without .php)
router.all('/freedom/check', freedomCheckWebhook);
router.all('/freedom/check.php', freedomCheckWebhook);

// 3. Freedom Pay Final Result Notification (server-to-server webhook, both GET and POST, with and without .php)
router.all('/freedom/result', freedomResultWebhook);
router.all('/freedom/result.php', freedomResultWebhook);

// 4. Client payment history & balance
router.get('/my', authenticateJWT, getMyPayments);
router.get('/balance', authenticateJWT, getUserBalance);

export default router;
