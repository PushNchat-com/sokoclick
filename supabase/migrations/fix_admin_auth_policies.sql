-- Description: Fix admin authentication policies
-- Following RLS policy guidelines for Supabase

-- Drop existing policies
drop policy if exists "Admin users can view other admins" on public.admin_users;
drop policy if exists "Admin users can view their own record" on public.admin_users;
drop policy if exists "Super admins can view all admin records" on public.admin_users;
drop policy if exists "Super admins can insert new admin users" on public.admin_users;
drop policy if exists "Super admins can update admin records" on public.admin_users;
drop policy if exists "Super admins can delete admin records" on public.admin_users;

-- 1. Policy for initial authentication (allows checking if email exists during login)
create policy "Allow email existence check during authentication"
on public.admin_users
for select
to authenticated, anon
using (
    -- During login, we only need to verify email existence
    true
);

-- 2. Policy for admin users to view their own record
create policy "Admin users can view their own record"
on public.admin_users
for select
to authenticated
using (
    email = auth.jwt() ->> 'email'
    or
    id = auth.uid()
);

-- 3. Policy for super admins to manage all records
create policy "Super admins can manage all records"
on public.admin_users
for all
to authenticated
using (
    auth.uid() in (
        select id 
        from public.admin_users 
        where role = 'super_admin'
    )
)
with check (
    auth.uid() in (
        select id 
        from public.admin_users 
        where role = 'super_admin'
    )
);

-- Ensure RLS is enabled
alter table public.admin_users enable row level security;

-- Verify the policies were created
select 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
from 
    pg_policies 
where 
    tablename = 'admin_users'
order by 
    policyname; 