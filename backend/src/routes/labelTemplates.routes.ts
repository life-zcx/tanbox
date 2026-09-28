import { Router } from 'express';
import {
  getLabelTemplates,
  getLabelTemplateById,
  createLabelTemplate,
  updateLabelTemplate,
  deleteLabelTemplate,
} from '../controllers/labelTemplates.controller';

const router = Router();

router.get('/', getLabelTemplates);
router.get('/:id', getLabelTemplateById);
router.post('/', createLabelTemplate);
router.put('/:id', updateLabelTemplate);
router.delete('/:id', deleteLabelTemplate);

export default router;
