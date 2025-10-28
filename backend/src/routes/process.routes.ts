import { Router } from 'express';
import { processController } from '../controllers/process.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/processes - Get all processes
router.get('/', processController.getProcesses);

// GET /api/processes/:id - Get process by ID
router.get('/:id', processController.getProcessById);

// POST /api/processes - Create process
router.post('/', processController.createProcess);

// PUT /api/processes/:id - Update process
router.put('/:id', processController.updateProcess);

// DELETE /api/processes/:id - Delete process
router.delete('/:id', processController.deleteProcess);

// POST /api/processes/:id/execute - Execute process
router.post('/:id/execute', processController.executeProcess);

// POST /api/processes/:id/share - Share process
router.post('/:id/share', processController.shareProcess);

// POST /api/processes/:id/export - Export process
router.post('/:id/export', processController.exportProcess);

// POST /api/processes/import - Import process
router.post('/import', processController.importProcess);

// POST /api/processes/:id/clone - Clone process
router.post('/:id/clone', processController.cloneProcess);

export default router;

