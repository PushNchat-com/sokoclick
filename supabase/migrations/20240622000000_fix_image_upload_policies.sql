-- Description: Fix and consolidate image upload policies
-- Following cursor rules for SQL migrations

-- Step 1: Drop all existing storage policies to start fresh
drop policy if exists "Product images are publicly accessible" on storage.objects;
drop policy if exists "Authenticated users can upload product images" on storage.objects;
drop policy if exists "Users can update their own product images" on storage.objects;
drop policy if exists "Users can delete their own product images" on storage.objects;
drop policy if exists "Admins can manage all product images" on storage.objects;
drop policy if exists "Anyone can view public product images" on storage.objects;
drop policy if exists "Admins can manage all images" on storage.objects;

-- Step 2: Update bucket configuration
update storage.buckets
set 
    public = true,
    file_size_limit = 5242880, -- 5MB
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
where id = 'product-images';

-- Step 3: Create new consolidated policies using is_admin function

-- Public read access for product images
create policy "Anyone can view product images"
on storage.objects
for select
to anon, authenticated
using (
    bucket_id = 'product-images' and
    (storage.foldername(name))[1] != 'private'
);

-- Authenticated users can upload their own images
create policy "Users can upload product images"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'product-images' and
    (
        -- Regular users can only upload to their own folder
        (storage.foldername(name))[1] = auth.uid()::text
        or
        -- Admins can upload anywhere
        public.is_admin(auth.jwt() ->> 'email')
    )
);

-- Users can manage their own images
create policy "Users can manage their images"
on storage.objects
for all
to authenticated
using (
    bucket_id = 'product-images' and
    (
        -- Regular users can only manage their own folder
        (storage.foldername(name))[1] = auth.uid()::text
        or
        -- Admins can manage all images
        public.is_admin(auth.jwt() ->> 'email')
    )
)
with check (
    bucket_id = 'product-images' and
    (
        -- Regular users can only manage their own folder
        (storage.foldername(name))[1] = auth.uid()::text
        or
        -- Admins can manage all images
        public.is_admin(auth.jwt() ->> 'email')
    )
);

-- Step 4: Create helper functions for image management

-- Function to clean up orphaned images
create or replace function public.cleanup_orphaned_images()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    image_url text;
begin
    -- Find image URLs that are not referenced in products table
    for image_url in
        select name
        from storage.objects o
        where bucket_id = 'product-images'
        and not exists (
            select 1
            from public.products p
            where p.image_urls @> array[o.name]
        )
    loop
        -- Delete orphaned image
        delete from storage.objects
        where bucket_id = 'product-images'
        and name = image_url;
    end loop;
end;
$$;

-- Function to validate image URLs in products
create or replace function public.validate_product_images()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    url text;
begin
    -- Check each image URL exists in storage
    foreach url in array new.image_urls
    loop
        if not exists (
            select 1
            from storage.objects
            where bucket_id = 'product-images'
            and name = url
        ) then
            raise exception 'Image URL % does not exist in storage', url;
        end if;
    end loop;
    
    return new;
end;
$$;

-- Create trigger for image validation
drop trigger if exists validate_product_images_trigger on public.products;
create trigger validate_product_images_trigger
    before insert or update on public.products
    for each row
    execute function public.validate_product_images();

-- Step 5: Schedule cleanup job
select
    cron.schedule(
        'cleanup-orphaned-images',
        '0 0 * * *', -- Run daily at midnight
        $$
        select public.cleanup_orphaned_images();
        $$
    ); 