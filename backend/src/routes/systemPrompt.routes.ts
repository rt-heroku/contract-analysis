import express from 'express';
import * as systemPromptController from '../controllers/systemPrompt.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';

const router = express.Router();

// All routes require authentication and admin access
router.use(authenticate, requireAdmin);

// Get all system prompts
router.get('/', systemPromptController.getAllSystemPrompts);

// Get system prompt by ID
router.get('/:id', systemPromptController.getSystemPromptById);

// Get all versions of a feature type
router.get('/feature/:featureType/versions', systemPromptController.getPromptVersions);

// Create system prompt
router.post('/', systemPromptController.createSystemPrompt);

// Update system prompt
router.put('/:id', systemPromptController.updateSystemPrompt);

// Delete system prompt
router.delete('/:id', systemPromptController.deleteSystemPrompt);

// Toggle active status
router.patch('/:id/toggle', systemPromptController.toggleActive);

// Test render prompt with variables
router.post('/:id/test-render', systemPromptController.testRenderPrompt);

export default router;

