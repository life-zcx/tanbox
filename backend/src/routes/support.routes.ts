import { Router } from 'express';
import { submitBugReport } from '../controllers/support.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { bugReportUpload } from '../middleware/upload.middleware';

const router = Router();

router.post('/bug-report', authenticateJWT, bugReportUpload.single('screenshot'), submitBugReport);

export default router;
