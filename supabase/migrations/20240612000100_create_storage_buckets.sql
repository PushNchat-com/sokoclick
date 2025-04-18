-- Migration: Create storage buckets for the application
-- Description: Creates storage buckets for images, avatars, and documents

-- Create images bucket
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- Set RLS policies for images bucket
-- Public read access, authenticated write access
create policy "Public can view images"
on storage.objects
for select
to public
using (bucket_id = 'images');

create policy "Authenticated users can upload images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'images');

create policy "Users can update their own images"
on storage.objects
for update
to authenticated
using (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);

-- Create avatars bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Set RLS policies for avatars bucket
-- Public read access, authenticated write access for own avatar
create policy "Public can view avatars"
on storage.objects
for select
to public
using (bucket_id = 'avatars');

create policy "Authenticated users can upload avatars"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own avatars"
on storage.objects
for update
to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own avatars"
on storage.objects
for delete
to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Create documents bucket
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Set RLS policies for documents bucket
-- More restricted - only accessible to authenticated users
create policy "Authenticated users can view documents"
on storage.objects
for select
to authenticated
using (bucket_id = 'documents');

create policy "Authenticated users can upload documents"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own documents"
on storage.objects
for update
to authenticated
using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own documents"
on storage.objects
for delete
to authenticated
using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text); 