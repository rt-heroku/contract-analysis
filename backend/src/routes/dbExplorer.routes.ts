import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import * as dbExplorerController from '../controllers/dbExplorer.controller';

const router = Router();

// All routes require authentication and admin role (for now)
router.use(authenticate);
router.use(requireAdmin);

// Connection management
router.post('/test-connection', dbExplorerController.testConnection);
router.get('/connectors', dbExplorerController.getConnectors);

// Schema exploration
router.get('/:connectorId/schemas', dbExplorerController.getSchemas);
router.get('/:connectorId/schemas/:schemaName/tables', dbExplorerController.getTables);
router.get('/:connectorId/schemas/:schemaName/functions', dbExplorerController.getFunctions);
router.get('/:connectorId/schemas/:schemaName/sequences', dbExplorerController.getSequences);
router.get('/:connectorId/schemas/:schemaName/materialized-views', dbExplorerController.getMaterializedViews);

// Table details
router.get('/:connectorId/schemas/:schemaName/tables/:tableName/columns', dbExplorerController.getColumns);
router.get('/:connectorId/schemas/:schemaName/tables/:tableName/indexes', dbExplorerController.getIndexes);
router.get('/:connectorId/schemas/:schemaName/tables/:tableName/foreign-keys', dbExplorerController.getForeignKeys);
router.get('/:connectorId/schemas/:schemaName/tables/:tableName/triggers', dbExplorerController.getTriggers);
router.get('/:connectorId/schemas/:schemaName/tables/:tableName/ddl', dbExplorerController.getTableDDL);
router.get('/:connectorId/schemas/:schemaName/tables/:tableName/data', dbExplorerController.getTableData);

// Query execution
router.post('/:connectorId/query', dbExplorerController.executeQuery);
router.post('/:connectorId/explain', dbExplorerController.explainQuery);

// Query history and favorites
router.get('/queries/history', dbExplorerController.getQueryHistory);
router.get('/queries/favorites', dbExplorerController.getFavorites);
router.post('/queries/favorites', dbExplorerController.saveFavorite);
router.put('/queries/:queryId', dbExplorerController.updateFavorite);
router.delete('/queries/:queryId', dbExplorerController.deleteQuery);

// Database statistics
router.get('/:connectorId/stats', dbExplorerController.getDatabaseStats);

export default router;

