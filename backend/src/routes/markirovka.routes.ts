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
  getNktSettingsHandler,
  updateNktSettingsHandler,
  testNktConnectionHandler,
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

// Party & National Catalog lookups & settings
router.get('/nkt-settings', getNktSettingsHandler);
router.put('/nkt-settings', requireAdmin, updateNktSettingsHandler);
router.post('/nkt-test', requireAdmin, testNktConnectionHandler);
router.get('/party/status', checkPartyStatus);
router.get('/products/search-by-gtin', getProductByGtin);

// Operations routes (True API & OMS)
router.get('/operations', getOperations);
router.get('/operations/auth-challenge', getAuthChallenge);
router.post('/operations/auth-simple', authSimpleSignIn);
router.post('/operations/validate', validateCodes);
router.post('/operations/aggregation', createAggregation);
router.post('/operations/disaggregation', createDisaggregation);
router.post('/operations/import-notification', createImportNotification);
router.post('/operations/retirement', createRetirement);
router.post('/operations/correction', createCorrection);
router.post('/operations/utilisation', createUtilisation);
router.post('/operations/return-to-turnover', createReturnToTurnover);
router.get('/operations/:id/receipt', getOperationReceipt);

// Sandbox & Activity endpoints restricted to Admin role
router.post('/sandbox/order-codes', requireAdmin, sandboxOrderCodes);
router.post('/sandbox/utilisation', requireAdmin, sandboxUtilisation);
router.get('/activity', requireAdmin, getRecentActivity);

export default router;
