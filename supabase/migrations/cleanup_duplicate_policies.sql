-- Description: Clean up duplicate admin policies
-- Following RLS policy guidelines for Supabase

-- Drop the duplicate policy
drop policy if exists "Super admin can manage admin users" on public.admin_users;

-- Verify the policies after cleanup
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