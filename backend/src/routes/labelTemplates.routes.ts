import { Router } from 'express';
import {
  getLabelTemplates,
  getLabelTemplateById,
  createLabelTemplate,
  updateLabelTemplate,
  deleteLabelTemplate,
} from '../controllers/labelTemplates.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getLabelTemplates);
router.get('/:id', getLabelTemplateById);
router.post('/', authenticateJWT, requireAdmin, createLabelTemplate);
router.put('/:id', authenticateJWT, requireAdmin, updateLabelTemplate);
router.delete('/:id', authenticateJWT, requireAdmin, deleteLabelTemplate);

export default router;
