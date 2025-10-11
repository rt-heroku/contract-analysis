import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import flowEditorController from '../controllers/flowEditor.controller';

const router = Router();

router.use(authenticate);

router.get('/', flowEditorController.getFlows);
router.get('/:id', flowEditorController.getFlowById);
router.post('/', flowEditorController.createFlow);
router.put('/:id', flowEditorController.updateFlow);
router.delete('/:id', flowEditorController.deleteFlow);

export default router;

