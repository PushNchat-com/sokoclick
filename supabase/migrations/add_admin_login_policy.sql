-- Description: Add policies for admin authentication
-- Following RLS policy guidelines for Supabase

-- Drop existing policies if any
drop policy if exists "Allow admin login attempts" on public.admin_users;

-- Policy for viewing admin records during authentication
create policy "Admin users can view their own record"
on public.admin_users
for select
to authenticated
using (
    email = auth.jwt() ->> 'email'
);

-- Policy for super admins to view all admin records
create policy "Super admins can view all admin records"
on public.admin_users
for select
to authenticated
using (
    (select role from public.admin_users where id = auth.uid()) = 'super_admin'
);

-- Policy for super admins to manage admin records
create policy "Super admins can insert new admin users"
on public.admin_users
for insert
to authenticated
with check (
    (select role from public.admin_users where id = auth.uid()) = 'super_admin'
);

create policy "Super admins can update admin records"
on public.admin_users
for update
to authenticated
using (
    (select role from public.admin_users where id = auth.uid()) = 'super_admin'
)
with check (
    (select role from public.admin_users where id = auth.uid()) = 'super_admin'
);

create policy "Super admins can delete admin records"
on public.admin_users
for delete
to authenticated
using (
    (select role from public.admin_users where id = auth.uid()) = 'super_admin'
);

-- Ensure RLS is enabled
alter table public.admin_users enable row level security; 