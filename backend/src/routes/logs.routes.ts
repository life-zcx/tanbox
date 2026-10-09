import { Router } from 'express';
import { handleFrontendLogs, getSystemLogs, clearSystemLogs } from '../controllers/logs.controller';
import { logsRateLimiter } from '../middleware/rateLimiter';
import { authenticateJWT, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public telemetry endpoint for frontend error reporting
router.post('/frontend', logsRateLimiter, handleFrontendLogs);

// Protected admin endpoint for inspecting server logs
router.get('/system', authenticateJWT, requireAdmin, getSystemLogs);
router.post('/system/clear', authenticateJWT, requireAdmin, clearSystemLogs);
router.delete('/system', authenticateJWT, requireAdmin, clearSystemLogs);

export default router;
