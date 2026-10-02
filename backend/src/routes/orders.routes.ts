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
  adjustOrderItemsCount,
  getOrderCodeItems,
  downloadSingleItemPdf,
  downloadRangeItemsPdf
} from '../controllers/orders.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth.middleware';
import { orderCodesUpload } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticateJWT);

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.patch('/:id/status', requireAdmin, updateOrderStatus);
router.patch('/:id/print-permission', requireAdmin, updateOrderPrintPermission);
router.patch('/:id/sticker-layout', requireAdmin, updateStickerLayout);
router.patch('/:id/sticker-approval', updateStickerApproval);
router.patch('/:id/adjust-count', adjustOrderItemsCount);
router.post('/:id/upload-codes', orderCodesUpload.single('file'), uploadOrderCodesFile);
router.get('/:id/codes-file', downloadOrderCodesFile);
router.get('/:id/codes-content', getOrderCodesContent);
router.get('/:id/items', getOrderCodeItems);
router.get('/:id/items/:itemIndex/pdf', downloadSingleItemPdf);
router.get('/:id/items-range/pdf', downloadRangeItemsPdf);
router.get('/:id/pdf', downloadOrderPdf);
router.get('/:id/act', downloadOrderAct);

export default router;
