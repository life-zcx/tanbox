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
import {
  getOperations,
  validateCodes,
  createAggregation,
  createDisaggregation,
  createImportNotification,
  createRetirement,
  createCorrection,
  createUtilisation,
  createReturnToTurnover,
  getProductByGtin,
  getOperationReceipt,
  checkPartyStatus,
  getAuthChallenge,
  authSimpleSignIn,
} from '../controllers/markirovkaOperations.controller';

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

// Party & National Catalog lookups
router.get('/party/status', checkPartyStatus);
router.get('/products/search-by-gtin', getProductByGtin);

// Operations routes (True API & OMS)
router.get('/operations', requireAdmin, getOperations);
router.get('/operations/auth-challenge', requireAdmin, getAuthChallenge);
router.post('/operations/auth-simple', requireAdmin, authSimpleSignIn);
router.post('/operations/validate', requireAdmin, validateCodes);
router.post('/operations/aggregation', requireAdmin, createAggregation);
router.post('/operations/disaggregation', requireAdmin, createDisaggregation);
router.post('/operations/import-notification', requireAdmin, createImportNotification);
router.post('/operations/retirement', requireAdmin, createRetirement);
router.post('/operations/correction', requireAdmin, createCorrection);
router.post('/operations/utilisation', requireAdmin, createUtilisation);
router.post('/operations/return-to-turnover', requireAdmin, createReturnToTurnover);
router.get('/operations/:id/receipt', requireAdmin, getOperationReceipt);

// Sandbox & Activity endpoints restricted to Admin role
router.post('/sandbox/order-codes', requireAdmin, sandboxOrderCodes);
router.post('/sandbox/utilisation', requireAdmin, sandboxUtilisation);
router.get('/activity', requireAdmin, getRecentActivity);

export default router;
