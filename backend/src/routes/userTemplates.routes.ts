import { Router } from 'express';
import {
  getUserTemplates,
  getUserTemplateById,
  createUserTemplate,
  updateUserTemplate,
  deleteUserTemplate,
  payUserTemplate,
  orderDesignerLayout,
} from '../controllers/userTemplates.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

router.get('/', getUserTemplates);
router.get('/:id', getUserTemplateById);
router.post('/', createUserTemplate);
router.post('/order-designer', orderDesignerLayout);
router.post('/:id/pay', payUserTemplate);
router.put('/:id', updateUserTemplate);
router.patch('/:id', updateUserTemplate);
router.delete('/:id', deleteUserTemplate);

export default router;
