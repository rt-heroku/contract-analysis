-- Cleanup duplicate connector actions from actions table
-- These actions should only exist in connector_actions table
-- They were created by the now-removed syncConnectorActionsToActionsTable function

-- This script removes all Action records that have a connectorId (indicating they're connector actions)
-- Connector actions are properly stored in connector_actions table and accessed via the Connectors tab

BEGIN;

-- Show what will be deleted
SELECT 
  id,
  name,
  "displayName",
  "actionType",
  "connectorId",
  "connectorOperation"
FROM actions
WHERE "connectorId" IS NOT NULL
  AND "actionType" = 'connector';

-- Delete connector actions from actions table
DELETE FROM actions
WHERE "connectorId" IS NOT NULL
  AND "actionType" = 'connector';

-- Show count of remaining actions
SELECT 
  "actionType",
  COUNT(*) as count
FROM actions
GROUP BY "actionType";

COMMIT;

