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
import {
  getCardsHandler,
  getCardByIdHandler,
  createCardHandler,
  updateCardHandler,
  deleteCardHandler,
  submitCardToNktHandler,
  checkCardStatusHandler,
  publishCardToNktHandler,
  getCategorySchemaHandler,
  listCategoriesHandler,
  translateToKazakhHandler,
} from '../controllers/markirovkaCards.controller';
import {
  getMptCatalogHandler,
  syncMptCatalogHandler,
} from '../controllers/markirovkaCatalog.controller';

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

import { productCardImageUpload } from '../middleware/upload.middleware';

// Product Cards & Catalog Registration (NKT & IS MPT)
router.get('/cards/categories', listCategoriesHandler);
router.get('/cards/categories/:category/schema', getCategorySchemaHandler);
router.post('/cards/translate-kk', translateToKazakhHandler);
router.get('/cards', getCardsHandler);
router.post('/cards', createCardHandler);
router.post('/cards/upload-photo', productCardImageUpload.single('file'), (req: any, res: any) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Файл изображения не загружен' });
  }
  const url = `/api/uploads/product-cards/${req.file.filename}`;
  return res.json({ success: true, url, filename: req.file.filename });
});
router.get('/cards/:id', getCardByIdHandler);
router.put('/cards/:id', updateCardHandler);
router.delete('/cards/:id', deleteCardHandler);
router.post('/cards/:id/submit-nkt', submitCardToNktHandler);
router.get('/cards/:id/check-status', checkCardStatusHandler);
router.post('/cards/:id/publish-nkt', publishCardToNktHandler);

// User's IS MPT Catalog & Sync
router.get('/catalog', getMptCatalogHandler);
router.post('/catalog/sync', syncMptCatalogHandler);

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
