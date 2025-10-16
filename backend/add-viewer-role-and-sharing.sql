-- Add viewer role to roles table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "roles" WHERE name = 'viewer') THEN
    INSERT INTO "roles" (name, description, created_at, updated_at)
    VALUES (
      'viewer',
      'Read-only access to view analysis history and documents',
      NOW(),
      NOW()
    );
    RAISE NOTICE 'Viewer role added successfully';
  ELSE
    RAISE NOTICE 'Viewer role already exists';
  END IF;
END $$;

-- Add default_menu_item column to users table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'default_menu_item') THEN
    ALTER TABLE "users" ADD COLUMN "default_menu_item" VARCHAR(50);
    RAISE NOTICE 'default_menu_item column added to users table';
  ELSE
    RAISE NOTICE 'default_menu_item column already exists';
  END IF;
END $$;

-- Add is_public column to uploads table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'uploads' AND column_name = 'is_public') THEN
    ALTER TABLE "uploads" ADD COLUMN "is_public" BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'is_public column added to uploads table';
  ELSE
    RAISE NOTICE 'is_public column already exists';
  END IF;
END $$;

-- Add shared_with column to uploads table (JSON array of user IDs)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'uploads' AND column_name = 'shared_with') THEN
    ALTER TABLE "uploads" ADD COLUMN "shared_with" JSONB DEFAULT '[]';
    RAISE NOTICE 'shared_with column added to uploads table';
  ELSE
    RAISE NOTICE 'shared_with column already exists';
  END IF;
END $$;

-- Add is_public column to analysis_records table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'analysis_records' AND column_name = 'is_public') THEN
    ALTER TABLE "analysis_records" ADD COLUMN "is_public" BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'is_public column added to analysis_records table';
  ELSE
    RAISE NOTICE 'is_public column already exists';
  END IF;
END $$;

-- Add shared_with column to analysis_records table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'analysis_records' AND column_name = 'shared_with') THEN
    ALTER TABLE "analysis_records" ADD COLUMN "shared_with" JSONB DEFAULT '[]';
    RAISE NOTICE 'shared_with column added to analysis_records table';
  ELSE
    RAISE NOTICE 'shared_with column already exists';
  END IF;
END $$;

-- Create demo viewer user
DO $$
DECLARE
  viewer_role_id INT;
  demo_user_id INT;
BEGIN
  -- Get viewer role ID
  SELECT id INTO viewer_role_id FROM "roles" WHERE name = 'viewer';
  
  -- Check if demo@mulesoft.com user exists
  IF NOT EXISTS (SELECT 1 FROM "users" WHERE email = 'demo@mulesoft.com') THEN
    -- Insert demo user (password: Demo@123)
    INSERT INTO "users" (email, password, first_name, last_name, default_menu_item, is_active, created_at, updated_at)
    VALUES (
      'demo@mulesoft.com',
      '$2b$10$YourHashedPasswordHere', -- Will be updated with actual hash
      'Demo',
      'Viewer',
      'history',
      TRUE,
      NOW(),
      NOW()
    )
    RETURNING id INTO demo_user_id;
    
    -- Assign viewer role to demo user
    INSERT INTO "user_roles" (user_id, role_id, assigned_at)
    VALUES (demo_user_id, viewer_role_id, NOW());
    
    RAISE NOTICE 'Demo viewer user created successfully';
  ELSE
    RAISE NOTICE 'Demo viewer user already exists';
  END IF;
END $$;

-- Display results
SELECT 
  'Roles' as table_name,
  id, 
  name, 
  description 
FROM "roles" 
WHERE name IN ('admin', 'user', 'viewer')
ORDER BY id;

SELECT 
  'Demo User' as info,
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.default_menu_item,
  r.name as role
FROM "users" u
LEFT JOIN "user_roles" ur ON u.id = ur.user_id
LEFT JOIN "roles" r ON ur.role_id = r.id
WHERE u.email = 'demo@mulesoft.com';

