import { Router } from 'express';
import {
  getUserTemplates,
  getUserTemplateById,
  createUserTemplate,
  updateUserTemplate,
  deleteUserTemplate,
} from '../controllers/userTemplates.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

router.get('/', getUserTemplates);
router.get('/:id', getUserTemplateById);
router.post('/', createUserTemplate);
router.patch('/:id', updateUserTemplate);
router.delete('/:id', deleteUserTemplate);

export default router;
