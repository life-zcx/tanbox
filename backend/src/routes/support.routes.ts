import { Router } from 'express';
import { submitBugReport, getBugReportAttachment } from '../controllers/support.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { bugReportUpload } from '../middleware/upload.middleware';

const router = Router();

router.post('/bug-report', authenticateJWT, bugReportUpload.single('screenshot'), submitBugReport);
router.get('/bug-reports/attachment/:filename', authenticateJWT, getBugReportAttachment);

export default router;

