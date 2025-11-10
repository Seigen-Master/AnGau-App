-- Setup Script for pg_cron Jobs and Storage Buckets
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/sql/new

-- ============================================
-- ENABLE pg_cron EXTENSION
-- ============================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- SCHEDULED JOBS
-- ============================================

-- Remove existing jobs if they exist
SELECT cron.unschedule('expire-schedules') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-schedules');
SELECT cron.unschedule('auto-clock-out') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-clock-out');
SELECT cron.unschedule('cleanup-assignments') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-assignments');

-- Job 1: Expire pending schedules after 20 minutes (runs every 5 minutes)
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

-- Job 2: Auto clock-out overdue active shifts (runs every minute)
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

-- Job 3: Daily cleanup of caregiver assignments (runs daily at midnight)
SELECT cron.schedule(
  'cleanup-assignments',
  '0 0 * * *',
  $$
  -- Placeholder for assignment cleanup logic
  -- This will be implemented based on your specific requirements
  SELECT 1;
  $$
);

-- ============================================
-- VERIFY JOBS
-- ============================================

-- View all scheduled jobs
SELECT * FROM cron.job;

-- ============================================
-- STORAGE BUCKETS SETUP
-- ============================================

-- Note: Storage buckets are created via the Supabase Dashboard
-- Go to: https://supabase.com/dashboard/project/fhnhewauxzznxpsfjdqz/storage/buckets

-- Create these buckets manually:
-- 1. profile-pictures
--    - Public: Yes
--    - File size limit: 5MB
--    - Allowed MIME types: image/*
--
-- 2. patient-pictures
--    - Public: Yes
--    - File size limit: 5MB
--    - Allowed MIME types: image/*
--
-- 3. message-images
--    - Public: Yes
--    - File size limit: 10MB
--    - Allowed MIME types: image/*

-- ============================================
-- STORAGE POLICIES (Run after creating buckets)
-- ============================================

-- Policy: Anyone can view public buckets
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id IN ('profile-pictures', 'patient-pictures', 'message-images') );

-- Policy: Authenticated users can upload to profile-pictures
CREATE POLICY "Authenticated users can upload profile pictures"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND auth.role() = 'authenticated'
);

-- Policy: Users can update their own profile pictures
CREATE POLICY "Users can update own profile pictures"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-pictures'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own profile pictures
CREATE POLICY "Users can delete own profile pictures"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-pictures'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Admins can upload patient pictures
CREATE POLICY "Admins can upload patient pictures"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'patient-pictures'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE auth_id = auth.uid()
    AND role = 'admin'
  )
);

-- Policy: Admins can update patient pictures
CREATE POLICY "Admins can update patient pictures"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'patient-pictures'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE auth_id = auth.uid()
    AND role = 'admin'
  )
);

-- Policy: Authenticated users can upload message images
CREATE POLICY "Authenticated users can upload message images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'message-images'
  AND auth.role() = 'authenticated'
);

-- ============================================
-- VERIFICATION
-- ============================================

-- Check if cron jobs are running
SELECT 
  jobname,
  schedule,
  active,
  jobid
FROM cron.job
ORDER BY jobname;

-- Check storage policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
ORDER BY policyname;

