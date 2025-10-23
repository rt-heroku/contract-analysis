-- Migration: Remove Anypoint credentials from user_profiles
-- Credentials now belong to idp_executions table

-- Remove anypoint_username and anypoint_password columns from user_profiles
ALTER TABLE user_profiles 
  DROP COLUMN IF EXISTS anypoint_username,
  DROP COLUMN IF EXISTS anypoint_password;

-- Add comment for documentation
COMMENT ON TABLE user_profiles IS 
  'User profile information. Anypoint credentials are stored in idp_executions table.';

