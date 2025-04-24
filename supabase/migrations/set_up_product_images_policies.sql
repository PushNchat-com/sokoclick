-- Create product_images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name)
SELECT 'product_images', 'product_images'
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'product_images');

-- Drop existing policies for product_images bucket to ensure clean slate
DROP POLICY IF EXISTS "Product images are publicly accessible 1" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images 1" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own product images 1" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own product images 1" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all product images 1" ON storage.objects;

-- Create policy for public access to product images
CREATE POLICY "Product images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'product_images');

-- Create policy for authenticated users to upload product images
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product_images' AND
  (auth.uid() = owner OR auth.jwt() ->> 'app_metadata'->>'role' = 'admin')
);

-- Create policy for users to update their own product images
CREATE POLICY "Users can update their own product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product_images' AND owner = auth.uid())
WITH CHECK (bucket_id = 'product_images' AND owner = auth.uid());

-- Create policy for users to delete their own product images
CREATE POLICY "Users can delete their own product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product_images' AND owner = auth.uid());

-- Create policy for admins to manage all product images
CREATE POLICY "Admins can manage all product images"
ON storage.objects
TO authenticated
USING (
  bucket_id = 'product_images' AND
  auth.jwt() ->> 'app_metadata'->>'role' = 'admin'
)
WITH CHECK (
  bucket_id = 'product_images' AND
  auth.jwt() ->> 'app_metadata'->>'role' = 'admin'
);

-- Verify that policies were created correctly
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM 
    pg_policies 
WHERE 
    tablename = 'objects' AND qual::text LIKE '%product_images%'; 