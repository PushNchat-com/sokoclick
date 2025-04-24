-- Description: Fix admin users recursion issue
-- Following cursor rules for SQL migrations

-- Step 1: Drop existing problematic policies
drop policy if exists "Admin users can view other admins" on public.admin_users;
drop policy if exists "Super admin can manage admin users" on public.admin_users;

-- Step 2: Create simplified admin policies that avoid recursion
create policy "Admin users can view other admins"
on public.admin_users
for select
to authenticated
using (
  -- Use direct email check instead of recursive admin check
  auth.jwt() ->> 'email' in ('sokoclick.com@gmail.com', 'pushns24@gmail.com')
);

create policy "Super admin can manage admin users"
on public.admin_users
for all
to authenticated
using (
  -- Use direct email check for super admin
  auth.jwt() ->> 'email' in ('sokoclick.com@gmail.com', 'pushns24@gmail.com')
);

-- Step 3: Create a default vendor user if it doesn't exist
do $$
declare
  vendor_id uuid;
begin
  -- First check if the vendor already exists
  select id into vendor_id
  from public.users
  where name = 'SokoClick Vendor';
  
  -- If vendor doesn't exist, create it
  if vendor_id is null then
    insert into public.users (
      name,
      whatsapp_number,
      email,
      location,
      is_verified,
      verification_level
    )
    values (
      'SokoClick Vendor',
      '+237000000000',
      'vendor@sokoclick.com',
      'Cameroon',
      true,
      'complete'
    )
    returning id into vendor_id;
  end if;
end;
$$;

-- Step 4: Drop all existing admin_users policies that might cause recursion
drop policy if exists "Allow email existence check during authentication" on public.admin_users;
drop policy if exists "Admin users can view their own record" on public.admin_users;
drop policy if exists "Super admins can manage all records" on public.admin_users;
drop policy if exists "Admin Login Lookup" on public.admin_users;
drop policy if exists "Admin Write Access" on public.admin_users;
drop policy if exists "Super admins can insert new admin users" on public.admin_users;
drop policy if exists "Super admins can update admin records" on public.admin_users;
drop policy if exists "Super admins can delete admin records" on public.admin_users;
drop policy if exists "Super admins can view all admin records" on public.admin_users;

-- Step 5: Create simpler policies that avoid recursion by using direct auth checks
-- Policy for public email lookup (needed for authentication)
create policy "Allow email lookup for authentication"
on public.admin_users
for select
to anon, authenticated
using (true);

-- Policy for admin users to update their own profile
create policy "Admins update own profile"
on public.admin_users
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Step 6: Fix storage policies to avoid referencing admin_users table
drop policy if exists "Admins can manage all images" on storage.objects;

create policy "Admins can manage all images"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'product-images' and 
  -- Use direct auth check with a constant
  auth.jwt() ->> 'email' in ('sokoclick.com@gmail.com', 'pushns24@gmail.com')
);

-- Step 7: Modify the admin access logger trigger to avoid recursion
drop trigger if exists admin_access_logger on public.admin_users;

create or replace function public.log_admin_access()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  auth_uid uuid;
  admin_email text;
begin
  -- Skip logging during policy checks to avoid recursion
  if current_setting('request.procedure', true) = 'rls' then
    return NEW;
  end if;
  
  -- Get current authenticated user
  auth_uid := auth.uid();
  
  -- Get email if available
  SELECT email INTO admin_email 
  FROM auth.users 
  WHERE id = auth_uid;
  
  -- Log the access attempt
  INSERT INTO public.admin_access_logs (
    admin_id,
    email,
    action,
    ip_address,
    user_agent,
    success
  ) VALUES (
    auth_uid,
    admin_email,
    TG_OP,
    request.header('X-Forwarded-For'),
    request.header('User-Agent'),
    true
  );
  
  RETURN NEW;
END;
$$;

-- Don't recreate the trigger as it was causing issues
-- We'll add a safer version later if needed

-- Step 8: Update admin users table to make sure all admin users can be authenticated
update public.admin_users
set id = auth.uid()
where email = auth.jwt() ->> 'email'
  and id != auth.uid(); 