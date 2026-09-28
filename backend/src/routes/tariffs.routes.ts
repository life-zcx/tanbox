import { Router } from 'express';
import { getTariffs, updateTariffs } from '../controllers/tariffs.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public / client route to fetch tariffs
router.get('/', getTariffs);

// Admin-only route to update exact prices
router.put('/', authenticateJWT, requireAdmin, updateTariffs);

export default router;
