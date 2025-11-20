import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import * as dbExplorerController from '../controllers/dbExplorer.controller';
import * as dbTableOperations from '../controllers/dbTableOperations.controller';
import * as dbDataOperations from '../controllers/dbDataOperations.controller';
import * as dbIndexOperations from '../controllers/dbIndexOperations.controller';

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
router.get('/:connectorId/schemas/:schemaName/tables/:tableName/constraints', dbExplorerController.getConstraints);
router.get('/:connectorId/schemas/:schemaName/tables/:tableName/policies', dbExplorerController.getPolicies);
router.get('/:connectorId/schemas/:schemaName/tables/:tableName/rules', dbExplorerController.getRules);
router.get('/:connectorId/schemas/:schemaName/tables/:tableName/ddl', dbExplorerController.getTableDDL);
router.get('/:connectorId/schemas/:schemaName/tables/:tableName/data', dbExplorerController.getTableData);

// Schema ERD
router.get('/:connectorId/schemas/:schemaName/erd', dbExplorerController.getSchemaERD);

// AI SQL Generation
router.post('/:connectorId/ai-generate', dbExplorerController.generateAISQL);

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

// Table operations
router.post('/:connectorId/tables/create', dbTableOperations.createTable);
router.post('/:connectorId/tables/drop', dbTableOperations.dropTable);
router.post('/:connectorId/tables/truncate', dbTableOperations.truncateTable);
router.post('/:connectorId/tables/rename', dbTableOperations.renameTable);
router.post('/:connectorId/tables/add-column', dbTableOperations.addColumn);
router.post('/:connectorId/tables/drop-column', dbTableOperations.dropColumn);
router.post('/:connectorId/tables/copy-structure', dbTableOperations.copyTableStructure);
router.post('/:connectorId/tables/duplicate', dbTableOperations.duplicateTable);

// Data operations
router.post('/:connectorId/data/insert', dbDataOperations.insertRow);
router.post('/:connectorId/data/update', dbDataOperations.updateRows);
router.post('/:connectorId/data/delete', dbDataOperations.deleteRows);
router.post('/:connectorId/data/bulk-insert', dbDataOperations.bulkInsert);
router.post('/:connectorId/data/bulk-delete', dbDataOperations.bulkDelete);

// Index operations
router.post('/:connectorId/indexes/create', dbIndexOperations.createIndex);
router.post('/:connectorId/indexes/drop', dbIndexOperations.dropIndex);

export default router;

