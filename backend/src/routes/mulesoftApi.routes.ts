import { Router } from 'express';
import { mulesoftApiController } from '../controllers/mulesoftApi.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get all MuleSoft APIs (mine + shared + admin all others)
router.get('/mulesoft-apis', authenticate, mulesoftApiController.getAll);

// Get single MuleSoft API by ID
router.get('/mulesoft-apis/:id', authenticate, mulesoftApiController.getById);

// Create new MuleSoft API
router.post('/mulesoft-apis', authenticate, mulesoftApiController.create);

// Update MuleSoft API
router.put('/mulesoft-apis/:id', authenticate, mulesoftApiController.update);

// Delete MuleSoft API (soft delete)
router.delete('/mulesoft-apis/:id', authenticate, mulesoftApiController.delete);

// Refresh flows from API /flows endpoint
router.post('/mulesoft-apis/:id/refresh-flows', authenticate, mulesoftApiController.refreshFlows);

// Test API connection
router.post('/mulesoft-apis/:id/test', authenticate, mulesoftApiController.testConnection);

// Share MuleSoft API with users
router.post('/mulesoft-apis/:id/share', authenticate, mulesoftApiController.share);

// Unshare MuleSoft API from user
router.delete('/mulesoft-apis/:id/share/:userId', authenticate, mulesoftApiController.unshare);

// Get shared users for an API
router.get('/mulesoft-apis/:id/shared-users', authenticate, mulesoftApiController.getSharedUsers);

export default router;

