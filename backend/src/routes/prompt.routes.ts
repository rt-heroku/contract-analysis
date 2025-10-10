import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import promptController from '../controllers/prompt.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all prompts (with optional search)
router.get('/', promptController.getAllPrompts);

// Get categories
router.get('/categories', promptController.getCategories);

// Get a single prompt
router.get('/:id', promptController.getPromptById);

// Create a new prompt
router.post('/', promptController.createPrompt);

// Update a prompt
router.put('/:id', promptController.updatePrompt);

// Delete a prompt
router.delete('/:id', promptController.deletePrompt);

// Execute a prompt with variables
router.post('/:id/execute', promptController.executePrompt);

// Set/unset default prompt (Admin only - auth check in controller)
router.put('/:id/set-default', promptController.setDefault);
router.put('/:id/unset-default', promptController.unsetDefault);

export default router;

