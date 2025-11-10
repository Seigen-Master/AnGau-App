-- Phase 2: Storage Buckets and Policies
-- Created: 2025-11-10
-- Description: Sets up storage buckets and RLS policies for file uploads

-- ============================================
-- CREATE STORAGE BUCKETS
-- ============================================

-- Bucket: profile-pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures',
  'profile-pictures',
  true,
  5242880, -- 5MB
  ARRAY['image/*']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Bucket: patient-pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'patient-pictures',
  'patient-pictures',
  true,
  5242880, -- 5MB
  ARRAY['image/*']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Bucket: message-images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-images',
  'message-images',
  true,
  10485760, -- 10MB
  ARRAY['image/*']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload patient pictures" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update patient pictures" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete patient pictures" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload message images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own message images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own message images" ON storage.objects;

-- Policy: Public read access to all buckets
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id IN ('profile-pictures', 'patient-pictures', 'message-images') );

-- Profile Pictures Policies
CREATE POLICY "Authenticated users can upload profile pictures"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own profile pictures"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-pictures'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own profile pictures"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-pictures'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Patient Pictures Policies (Admin only)
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

CREATE POLICY "Admins can delete patient pictures"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'patient-pictures'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE auth_id = auth.uid()
    AND role = 'admin'
  )
);

-- Message Images Policies
CREATE POLICY "Authenticated users can upload message images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'message-images'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own message images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'message-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own message images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'message-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

