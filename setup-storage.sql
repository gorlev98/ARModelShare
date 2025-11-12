-- ============================================================================
-- STORAGE BUCKET SETUP FOR USER LOGOS
-- ============================================================================
-- Run this script in your Supabase SQL Editor to set up the logos storage bucket
-- with proper Row Level Security policies

-- Step 1: Create the storage bucket (if it doesn't exist)
-- Note: This must be done manually in the Supabase Dashboard UI:
-- 1. Go to Storage section
-- 2. Click "New bucket"
-- 3. Name: "logos"
-- 4. Public: YES (check this box)
-- 5. Click "Create bucket"

-- Step 2: Set up Row Level Security policies for the storage bucket

-- First, remove any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;

-- Policy 1: Allow authenticated users to upload their own logos
-- This allows users to INSERT files into the logos bucket in their own folder
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Allow authenticated users to update their own logos
-- This allows users to UPDATE files in the logos bucket in their own folder
CREATE POLICY "Allow authenticated updates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow authenticated users to delete their own logos
-- This allows users to DELETE files in the logos bucket in their own folder
CREATE POLICY "Allow authenticated deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow public read access to all logos
-- This allows anyone (including anonymous users) to view the logos
CREATE POLICY "Allow public reads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'logos');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- After running the above policies, you can verify them with these queries:

-- Check if the bucket exists
SELECT * FROM storage.buckets WHERE name = 'logos';

-- Check the policies on storage.objects for the logos bucket
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND policyname LIKE '%authenticated%' OR policyname LIKE '%public%';
