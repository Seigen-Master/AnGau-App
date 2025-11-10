-- Phase 2: Database Triggers and Scheduled Jobs
-- Created: 2025-11-10
-- Description: Replaces Firebase Cloud Functions with PostgreSQL triggers and pg_cron jobs

-- ============================================
-- ENABLE EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- TRIGGER FUNCTIONS
-- ============================================

-- 1. Handle Approved Requests
CREATE OR REPLACE FUNCTION handle_approved_request()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    IF NEW.type = 'cancellation' THEN
      -- Update schedule status to cancelled
      UPDATE schedules 
      SET status = 'cancelled' 
      WHERE id = NEW.schedule_id;
      
      -- Add cancellation bonus to caregiver
      UPDATE users 
      SET cancellation_bonus = COALESCE(cancellation_bonus, 0) + 1.5 
      WHERE id = NEW.caregiver_id;
      
      RAISE NOTICE 'Approved cancellation request for schedule %', NEW.schedule_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Unassign Patient on Shift Completion
CREATE OR REPLACE FUNCTION unassign_patient_on_completion()
RETURNS TRIGGER AS $$
DECLARE
  has_future_schedules BOOLEAN;
BEGIN
  -- Only process if status changed to completed, cancelled, or expired
  IF NEW.status IN ('completed', 'cancelled', 'expired') 
     AND (OLD.status IS NULL OR OLD.status NOT IN ('completed', 'cancelled', 'expired')) THEN
    
    -- Check if caregiver has any future schedules with this patient
    SELECT EXISTS (
      SELECT 1 FROM schedules
      WHERE caregiver_id = NEW.caregiver_id
        AND patient_id = NEW.patient_id
        AND status IN ('pending', 'active')
        AND start_timestamp >= NOW()
    ) INTO has_future_schedules;
    
    IF NOT has_future_schedules THEN
      RAISE NOTICE 'No future schedules found for caregiver % and patient %', 
        NEW.caregiver_id, NEW.patient_id;
      -- Note: Assignment tracking implementation depends on your data model
      -- This is a placeholder for the unassignment logic
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create Notification on New Message
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  sender_name TEXT;
  conversation_participants UUID[];
BEGIN
  -- Get conversation participants
  SELECT participants INTO conversation_participants
  FROM conversations
  WHERE id = NEW.conversation_id;
  
  -- Find recipient (the other participant)
  SELECT p INTO recipient_id
  FROM unnest(conversation_participants) AS p
  WHERE p != NEW.sender_id
  LIMIT 1;
  
  IF recipient_id IS NULL THEN
    RAISE NOTICE 'No recipient found for message in conversation %', NEW.conversation_id;
    RETURN NEW;
  END IF;
  
  -- Get sender name
  SELECT name INTO sender_name
  FROM users
  WHERE id = NEW.sender_id;
  
  -- Delete existing notifications for this conversation to avoid duplicates
  DELETE FROM notifications
  WHERE recipient_id = recipient_id
    AND resource_id = NEW.conversation_id
    AND type = 'message';
  
  -- Insert new notification
  INSERT INTO notifications (
    recipient_id,
    sender_id,
    sender_name,
    type,
    resource_id,
    content,
    read,
    created_at
  ) VALUES (
    recipient_id,
    NEW.sender_id,
    COALESCE(sender_name, 'Unknown Sender'),
    'message',
    NEW.conversation_id,
    NEW.content,
    false,
    NOW()
  );
  
  RAISE NOTICE 'Created message notification for user %', recipient_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create Notifications on Request Change
CREATE OR REPLACE FUNCTION notify_on_request_change()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
BEGIN
  -- New request - notify all admins
  IF TG_OP = 'INSERT' THEN
    FOR admin_record IN 
      SELECT id FROM users WHERE role = 'admin'
    LOOP
      INSERT INTO notifications (
        recipient_id,
        sender_id,
        sender_name,
        type,
        resource_id,
        read,
        created_at
      ) VALUES (
        admin_record.id,
        NEW.caregiver_id,
        NEW.caregiver_name,
        CASE NEW.type
          WHEN 'cancellation' THEN 'cancellation_request'
          WHEN 'overtime' THEN 'overtime_request'
          ELSE 'request'
        END,
        NEW.id,
        false,
        NOW()
      );
    END LOOP;
    
    RAISE NOTICE 'Notified admins of new % request from %', NEW.type, NEW.caregiver_name;
  END IF;
  
  -- Request status changed - notify caregiver
  IF TG_OP = 'UPDATE' AND OLD.status = 'pending' 
     AND NEW.status IN ('approved', 'denied') THEN
    INSERT INTO notifications (
      recipient_id,
      sender_id,
      sender_name,
      type,
      resource_id,
      content,
      read,
      created_at
    ) VALUES (
      NEW.caregiver_id,
      NULL, -- System notification
      'Admin',
      'request_' || NEW.status,
      NEW.id,
      'Your ' || NEW.type || ' request for patient ' || NEW.patient_name || ' has been ' || NEW.status || '.',
      false,
      NOW()
    );
    
    RAISE NOTICE 'Notified caregiver % of request %', NEW.caregiver_id, NEW.status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CREATE TRIGGERS
-- ============================================

-- Trigger: Handle approved requests
DROP TRIGGER IF EXISTS on_request_approved ON requests;
CREATE TRIGGER on_request_approved
  AFTER UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_approved_request();

-- Trigger: Unassign patient on shift completion
DROP TRIGGER IF EXISTS on_schedule_completion ON schedules;
CREATE TRIGGER on_schedule_completion
  AFTER UPDATE ON schedules
  FOR EACH ROW
  EXECUTE FUNCTION unassign_patient_on_completion();

-- Trigger: Create notification on new message
DROP TRIGGER IF EXISTS on_new_message ON messages;
CREATE TRIGGER on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_notification();

-- Trigger: Notify on request changes
DROP TRIGGER IF EXISTS on_request_change ON requests;
CREATE TRIGGER on_request_change
  AFTER INSERT OR UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_request_change();

-- ============================================
-- SCHEDULED JOBS (pg_cron)
-- ============================================

-- Note: pg_cron jobs need to be created in the postgres database
-- These will be set up via the Supabase dashboard or SQL editor

-- Job 1: Expire pending schedules after 20 minutes (every 5 minutes)
-- Run this in Supabase SQL Editor:
/*
SELECT cron.schedule(
  'expire-schedules',
  '*/5 * * * *',
  $$
  UPDATE schedules
  SET status = 'expired'
  WHERE status = 'pending'
    AND start_timestamp + INTERVAL '20 minutes' < NOW();
  $$
);
*/

-- Job 2: Auto clock-out overdue active shifts (every minute)
-- Run this in Supabase SQL Editor:
/*
SELECT cron.schedule(
  'auto-clock-out',
  '* * * * *',
  $$
  UPDATE schedules
  SET 
    status = 'completed',
    clock_out = end_timestamp,
    notes = COALESCE(notes, '') || ' [System Auto-Clock-Out: Shift ended and not clocked out within 10 minutes. Overdue time not counted.]'
  WHERE status = 'active'
    AND end_timestamp + INTERVAL '10 minutes' < NOW()
    AND clock_out IS NULL;
  $$
);
*/

-- Job 3: Daily cleanup of caregiver assignments (daily at midnight)
-- Run this in Supabase SQL Editor:
/*
SELECT cron.schedule(
  'cleanup-assignments',
  '0 0 * * *',
  $$
  -- Placeholder for assignment cleanup logic
  -- This depends on your specific assignment tracking implementation
  SELECT 1;
  $$
);
*/

-- ============================================
-- HELPER FUNCTIONS FOR EDGE FUNCTIONS
-- ============================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role user_role;
BEGIN
  SELECT role INTO user_role
  FROM users
  WHERE auth_id = user_id;
  
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user by auth_id
CREATE OR REPLACE FUNCTION get_user_by_auth_id(auth_user_id UUID)
RETURNS TABLE (
  id UUID,
  auth_id UUID,
  name TEXT,
  email TEXT,
  role user_role,
  status user_status
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.auth_id,
    u.name,
    u.email,
    u.role,
    u.status
  FROM users u
  WHERE u.auth_id = auth_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION handle_approved_request() IS 'Processes approved requests: updates schedule status and adds cancellation bonus';
COMMENT ON FUNCTION unassign_patient_on_completion() IS 'Unassigns patient from caregiver when shift completes and no future schedules exist';
COMMENT ON FUNCTION create_message_notification() IS 'Creates or updates notification when new message is sent';
COMMENT ON FUNCTION notify_on_request_change() IS 'Notifies admins of new requests and caregivers of status changes';
COMMENT ON FUNCTION is_admin(UUID) IS 'Helper function to check if user has admin role';
COMMENT ON FUNCTION get_user_by_auth_id(UUID) IS 'Helper function to get user details by auth_id';

