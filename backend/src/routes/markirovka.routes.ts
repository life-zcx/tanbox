import { Router } from 'express';
import { authenticateJWT, requireAdmin } from '../middleware/auth.middleware';
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  testConnection,
  sandboxOrderCodes,
  sandboxUtilisation,
  getRecentActivity,
  generateLabelsPdf,
} from '../controllers/markirovka.controller';

const router = Router();

// Base auth for all markirovka routes
router.use(authenticateJWT);

// Account management (filtered by user id for clients, all for admin)
router.get('/accounts', getAccounts);
router.post('/accounts', createAccount);
router.put('/accounts/:id', updateAccount);
router.delete('/accounts/:id', deleteAccount);
router.post('/test-connection', testConnection);
router.post('/generate-labels-pdf', generateLabelsPdf);

// Sandbox & Activity endpoints restricted to Admin role
router.post('/sandbox/order-codes', requireAdmin, sandboxOrderCodes);
router.post('/sandbox/utilisation', requireAdmin, sandboxUtilisation);
router.get('/activity', requireAdmin, getRecentActivity);

export default router;
