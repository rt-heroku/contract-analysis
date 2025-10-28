import { Router } from 'express';
import { connectorController } from '../controllers/connector.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/connectors - Get all connectors
router.get('/', connectorController.getConnectors);

// GET /api/connectors/:id - Get connector by ID
router.get('/:id', connectorController.getConnectorById);

// POST /api/connectors - Create connector
router.post('/', connectorController.createConnector);

// PUT /api/connectors/:id - Update connector
router.put('/:id', connectorController.updateConnector);

// DELETE /api/connectors/:id - Delete connector
router.delete('/:id', connectorController.deleteConnector);

// POST /api/connectors/:id/test - Test connector connection
router.post('/:id/test', connectorController.testConnection);

// POST /api/connectors/:id/import-openapi - Import OpenAPI spec
router.post('/:id/import-openapi', connectorController.importOpenApi);

// GET /api/connectors/:id/actions - Get connector actions
router.get('/:id/actions', connectorController.getConnectorActions);

export default router;

