import { Router } from 'express';
import {
  getSystemHealth,
  getBackupsList,
  createDatabaseBackup,
  downloadBackupFile,
  getStorageAnalysis,
  cleanPdfCache,
  toggleMaintenanceMode,
  testTelegramAlert,
} from '../controllers/system.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Protect ALL server management operations with JWT and Admin role
router.use(authenticateJWT, requireAdmin);

router.get('/health', getSystemHealth);
router.get('/backups', getBackupsList);
router.post('/backups', createDatabaseBackup);
router.get('/backups/:fileName/download', downloadBackupFile);
router.get('/storage', getStorageAnalysis);
router.post('/storage/clean-cache', cleanPdfCache);
router.post('/maintenance', toggleMaintenanceMode);
router.post('/telegram/test', testTelegramAlert);

export default router;
