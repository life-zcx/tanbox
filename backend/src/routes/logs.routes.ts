import { Router } from 'express';
import { handleFrontendLogs } from '../controllers/logs.controller';

const router = Router();

router.post('/frontend', handleFrontendLogs);

export default router;
