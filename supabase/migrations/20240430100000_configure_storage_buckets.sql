-- Description: Configure storage buckets for product images
-- Following cursor rules for SQL migrations

-- Step 1: Create product images storage bucket if it doesn't exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images', 
  'Product Images', 
  true, 
  5242880, -- 5MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

-- Step 2: Create storage policies

-- Drop existing policies first to avoid errors
drop policy if exists "Anyone can view public product images" on storage.objects;
drop policy if exists "Authenticated users can upload images" on storage.objects;
drop policy if exists "Users can update their own images" on storage.objects;
drop policy if exists "Users can delete their own images" on storage.objects;
drop policy if exists "Admins can manage all images" on storage.objects;

-- Policy to allow anyone to view public product images
create policy "Anyone can view public product images"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'product-images' and
  (storage.foldername(name))[1] != 'private'
);

-- Policy to allow authenticated users to upload images
create policy "Authenticated users can upload images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
);

-- Policy to allow users to update their own images
create policy "Users can update their own images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images' and
  (auth.uid())::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'product-images' and
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- Policy to allow users to delete their own images
create policy "Users can delete their own images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images' and
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- Step 3: Create admin policies for managing all images
create policy "Admins can manage all images"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'product-images' and
  auth.uid() in (select id from public.admin_users)
);

-- Step 4: Verify storage bucket was created
do $$
declare
  bucket_exists boolean;
begin
  select exists(
    select 1 from storage.buckets where id = 'product-images'
  ) into bucket_exists;
  
  if not bucket_exists then
    raise exception 'Storage bucket for product images was not created properly';
  end if;
end$$; 