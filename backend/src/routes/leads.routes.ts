import { Router } from 'express';
import { createLead, getLeads, updateLeadStatus } from '../controllers/leads.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public route for creating leads from landing page
router.post('/', createLead);

// Protected admin routes
router.get('/admin', authenticateJWT, requireAdmin, getLeads);
router.patch('/admin/:id', authenticateJWT, requireAdmin, updateLeadStatus);

export default router;
