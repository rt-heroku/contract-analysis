-- Add show_demo_credentials setting to system_settings table
-- This setting controls whether demo credentials are displayed on the login page

DO $$
BEGIN
  -- Add show_demo_credentials setting if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM "system_settings" WHERE setting_key = 'show_demo_credentials'
  ) THEN
    INSERT INTO "system_settings" (
      setting_key,
      setting_value,
      description,
      is_secret,
      created_at,
      updated_at
    ) VALUES (
      'show_demo_credentials',
      'true',
      'Display demo credentials on login page (true/false)',
      false,
      NOW(),
      NOW()
    );
    RAISE NOTICE 'show_demo_credentials setting added successfully';
  ELSE
    RAISE NOTICE 'show_demo_credentials setting already exists';
  END IF;
END $$;

-- Verify the setting
SELECT 
  id,
  setting_key,
  setting_value,
  description,
  is_secret
FROM "system_settings"
WHERE setting_key = 'show_demo_credentials';

