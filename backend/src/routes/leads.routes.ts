import { Router } from 'express';
import { createLead, getLeads, updateLeadStatus } from '../controllers/leads.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth.middleware';
import { leadRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public route for creating leads with rate limiting
router.post('/', leadRateLimiter, createLead);

// Protected admin routes
router.get('/admin', authenticateJWT, requireAdmin, getLeads);
router.patch('/admin/:id', authenticateJWT, requireAdmin, updateLeadStatus);

export default router;
