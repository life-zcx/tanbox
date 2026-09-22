import { Router } from 'express';
import { getAdminMetrics } from '../controllers/metrics.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, requireAdmin, getAdminMetrics);

export default router;
