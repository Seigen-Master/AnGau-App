-- Test Users for Login Testing
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/sql/new

-- ============================================
-- CREATE TEST AUTH USERS
-- ============================================

-- Note: You'll need to create these users via the Supabase Auth dashboard first
-- Then run this script to add them to the users table

-- Instructions:
-- 1. Go to: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/auth/users
-- 2. Click "Add user" -> "Create new user"
-- 3. Create these two users:
--    - Email: admin@test.com, Password: Admin123!
--    - Email: caregiver@test.com, Password: Caregiver123!
-- 4. Copy their User UIDs
-- 5. Replace the UUIDs below with the actual User UIDs
-- 6. Run this script

-- ============================================
-- INSERT TEST USERS INTO DATABASE
-- ============================================

-- Admin User
INSERT INTO users (
  auth_id,
  name,
  email,
  role,
  status,
  phone,
  position,
  rate_per_hour,
  created_at,
  updated_at
) VALUES (
  'REPLACE_WITH_ADMIN_AUTH_ID'::uuid,  -- Replace this with actual auth user ID
  'Admin Test User',
  'admin@test.com',
  'admin',
  'active',
  '+1234567890',
  'Full-time',
  25.00,
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- Caregiver User
INSERT INTO users (
  auth_id,
  name,
  email,
  role,
  status,
  phone,
  position,
  rate_per_hour,
  created_at,
  updated_at
) VALUES (
  'REPLACE_WITH_CAREGIVER_AUTH_ID'::uuid,  -- Replace this with actual auth user ID
  'Caregiver Test User',
  'caregiver@test.com',
  'caregiver',
  'active',
  '+1234567891',
  'Full-time',
  20.00,
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- ============================================
-- VERIFY TEST USERS
-- ============================================

-- Check if users were created
SELECT 
  id,
  name,
  email,
  role,
  status,
  auth_id
FROM users
WHERE email IN ('admin@test.com', 'caregiver@test.com')
ORDER BY role;

