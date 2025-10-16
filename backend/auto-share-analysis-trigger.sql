-- Auto-share analysis record with all new users
-- This trigger automatically adds new users to the sharedWith array of a specific analysis record

-- Function to add new user to sharedWith array
CREATE OR REPLACE FUNCTION auto_share_analysis_with_new_user()
RETURNS TRIGGER AS $$
DECLARE
    target_analysis_id INT := 60; -- Analysis record ID to share
    current_shared_with JSONB;
    new_shared_with JSONB;
BEGIN
    -- Get current sharedWith array
    SELECT shared_with INTO current_shared_with
    FROM analysis_records
    WHERE id = target_analysis_id AND is_deleted = false;
    
    -- Only proceed if analysis record exists
    IF current_shared_with IS NOT NULL THEN
        -- Check if user is already in the array
        IF NOT (current_shared_with @> to_jsonb(NEW.id)) THEN
            -- Add new user ID to the array
            new_shared_with := current_shared_with || to_jsonb(NEW.id);
            
            -- Update analysis record
            UPDATE analysis_records
            SET shared_with = new_shared_with,
                updated_at = NOW()
            WHERE id = target_analysis_id;
            
            RAISE NOTICE 'Auto-shared analysis record % with new user %', target_analysis_id, NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires after user insert
DROP TRIGGER IF EXISTS trigger_auto_share_analysis ON users;

CREATE TRIGGER trigger_auto_share_analysis
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION auto_share_analysis_with_new_user();

-- Verify trigger was created
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_share_analysis';

-- Test: Show current analysis record shared_with
SELECT 
    id,
    user_id as owner_id,
    job_id,
    status,
    shared_with,
    created_at
FROM analysis_records
WHERE id = 60;

RAISE NOTICE 'Trigger created successfully! Analysis record ID 60 will be automatically shared with all new users.';

