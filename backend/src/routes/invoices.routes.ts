import { Router } from 'express';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  getInvoicePdf,
  payInvoiceWithBalance,
} from '../controllers/invoices.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// List invoices (Admin: all, Client: own)
router.get('/', authenticateJWT, getInvoices);

// View / download invoice PDF
router.get('/:id/pdf', authenticateJWT, getInvoicePdf);

// View single invoice details
router.get('/:id', authenticateJWT, getInvoiceById);

// Client: Pay invoice using balance
router.post('/:id/pay-balance', authenticateJWT, payInvoiceWithBalance);

// Admin-only operations
router.post('/', authenticateJWT, requireAdmin, createInvoice);
router.patch('/:id/status', authenticateJWT, requireAdmin, updateInvoiceStatus);
router.delete('/:id', authenticateJWT, requireAdmin, deleteInvoice);

export default router;
