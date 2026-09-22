import { Router } from 'express';
import { getUsers } from '../controllers/users.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, requireAdmin, getUsers);

export default router;
