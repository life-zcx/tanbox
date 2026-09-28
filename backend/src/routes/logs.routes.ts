import { Router } from 'express';
import { handleFrontendLogs } from '../controllers/logs.controller';
import { logsRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/frontend', logsRateLimiter, handleFrontendLogs);

export default router;
