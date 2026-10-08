import { Router } from 'express';
import { 
  createOrder, 
  getOrders, 
  getOrderById, 
  updateOrderStatus,
  updateOrderPrintPermission,
  updateStickerLayout,
  updateStickerApproval,
  uploadOrderCodesFile,
  downloadOrderCodesFile,
  getOrderCodesContent,
  downloadOrderPdf,
  downloadOrderAct,
  downloadOrderInvoice,
  adjustOrderItemsCount,
  updateOrderStickeringEstimate,
  getOrderCodeItems,
  getCodesRegistry,
  downloadSingleItemPdf,
  downloadRangeItemsPdf,
  getPdfQueueStatus,
  updatePdfQueueConcurrency,
  getOrderPdfStatus,
  checkCodesFile,
  syncMarkirovkaOrderCodes,
  generateTestCodesForOrder,
  submitOrderUtilisationReport,
} from '../controllers/orders.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth.middleware';
import { orderCodesUpload } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticateJWT);

router.post('/check-codes', orderCodesUpload.single('file'), checkCodesFile);
router.post('/', createOrder);
router.get('/', getOrders);
router.get('/queue/status', getPdfQueueStatus);
router.post('/queue/concurrency', requireAdmin, updatePdfQueueConcurrency);
router.get('/registry/codes', getCodesRegistry);
router.get('/:id/pdf-status', getOrderPdfStatus);
router.get('/:id', getOrderById);
router.patch('/:id/status', requireAdmin, updateOrderStatus);
router.patch('/:id/print-permission', requireAdmin, updateOrderPrintPermission);
router.patch('/:id/sticker-layout', requireAdmin, updateStickerLayout);
router.patch('/:id/sticker-approval', updateStickerApproval);
router.patch('/:id/adjust-count', adjustOrderItemsCount);
router.patch('/:id/stickering-estimate', requireAdmin, updateOrderStickeringEstimate);
router.post('/:id/upload-codes', orderCodesUpload.single('file'), uploadOrderCodesFile);
router.post('/:id/sync-markirovka', syncMarkirovkaOrderCodes);
router.post('/:id/generate-test-codes', requireAdmin, generateTestCodesForOrder);
router.post('/:id/submit-utilisation', requireAdmin, submitOrderUtilisationReport);
router.get('/:id/codes-file', downloadOrderCodesFile);
router.get('/:id/codes-content', getOrderCodesContent);
router.get('/:id/items', getOrderCodeItems);
router.get('/:id/items/:itemIndex/pdf', downloadSingleItemPdf);
router.get('/:id/items-range/pdf', downloadRangeItemsPdf);
router.get('/:id/pdf', downloadOrderPdf);
router.get('/:id/act', downloadOrderAct);
router.get('/:id/invoice', downloadOrderInvoice);

export default router;
