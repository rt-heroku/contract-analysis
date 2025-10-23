-- Migration: Auto-populate execution_id from mulesoft_response JSON
-- This trigger ensures execution_id is always synced with the 'id' field in mulesoft_response

-- First, update any existing records that have mulesoft_response with 'id' but null execution_id
UPDATE contract_analysis 
SET execution_id = mulesoft_response->>'id'
WHERE mulesoft_response ? 'id'
  AND (execution_id IS NULL OR execution_id = '');

-- Create function to auto-populate execution_id
CREATE OR REPLACE FUNCTION sync_execution_id_from_response()
RETURNS TRIGGER AS $$
BEGIN
  -- If mulesoft_response has an 'id' field, use it for execution_id
  IF NEW.mulesoft_response ? 'id' THEN
    NEW.execution_id := NEW.mulesoft_response->>'id';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires BEFORE INSERT OR UPDATE
CREATE TRIGGER trigger_sync_execution_id
  BEFORE INSERT OR UPDATE OF mulesoft_response
  ON contract_analysis
  FOR EACH ROW
  EXECUTE FUNCTION sync_execution_id_from_response();

-- Add comment for documentation
COMMENT ON TRIGGER trigger_sync_execution_id ON contract_analysis IS 
  'Automatically populates execution_id from mulesoft_response JSON id field';

