-- Script to set up storage policies for the product_images bucket
-- Run this in your Supabase SQL Editor

-- First, make sure the bucket exists with correct settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product_images', 
  'Product Images', 
  true, 
  5242880, -- 5MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view public product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all images" ON storage.objects;

-- 1. Allow public access for viewing images
CREATE POLICY "Anyone can view public product images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product_images');

-- 2. Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product_images');

-- 3. Allow users to update their own images
CREATE POLICY "Users can update their own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product_images')
WITH CHECK (bucket_id = 'product_images');

-- 4. Allow users to delete their own images
CREATE POLICY "Users can delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product_images');

-- 5. Allow admins to manage all images (assuming you have an admin_users table)
CREATE POLICY "Admins can manage all images"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'product_images' AND
  auth.uid() IN (SELECT id FROM public.admin_users)
);

-- Verify the bucket and policies were created
SELECT id, name, public FROM storage.buckets WHERE id = 'product_images';
SELECT policyname, tablename, permissive FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage'; 