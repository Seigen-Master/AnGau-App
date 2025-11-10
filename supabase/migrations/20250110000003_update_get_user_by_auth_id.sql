-- Phase 2: Update get_user_by_auth_id function to include additional fields
-- Created: 2025-11-10
-- Description: Adds phone, profile picture, fingerprint, pin fields to helper function

DROP FUNCTION IF EXISTS get_user_by_auth_id(UUID);

CREATE FUNCTION get_user_by_auth_id(auth_user_id UUID)
RETURNS TABLE (
  id UUID,
  auth_id UUID,
  name TEXT,
  email TEXT,
  role user_role,
  status user_status,
  phone TEXT,
  profile_picture_url TEXT,
  fingerprint_enabled BOOLEAN,
  pin TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.auth_id,
    u.name,
    u.email,
    u.role,
    u.status,
    u.phone,
    u.profile_picture_url,
    u.fingerprint_enabled,
    u.pin
  FROM users u
  WHERE u.auth_id = auth_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
