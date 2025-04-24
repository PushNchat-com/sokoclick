-- Description: Verify admin users setup and policies
-- Following SQL style guide for complex queries using CTEs

-- First verify admin users data
with admin_data as (
    -- Get admin users with their auth data
    select 
        au.id as admin_id,
        au.email as admin_email,
        au.role as admin_role,
        au.permissions as admin_permissions,
        u.id as auth_user_id,
        u.email as auth_user_email,
        u.confirmed_at as email_confirmed_at
    from 
        public.admin_users au
    left join 
        auth.users u on u.id = au.id
    where 
        au.email in ('sokoclick.com@gmail.com', 'pushns24@gmail.com')
),
policy_data as (
    -- Get RLS policies for admin_users table
    select 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
    from 
        pg_policies
    where 
        tablename = 'admin_users'
        and schemaname = 'public'
)
-- Output verification results separately
select 
    'Admin Users Data'::text as verification_type,
    json_build_object(
        'admin_id', admin_id,
        'admin_email', admin_email,
        'admin_role', admin_role,
        'admin_permissions', admin_permissions,
        'auth_user_id', auth_user_id,
        'auth_user_email', auth_user_email,
        'email_confirmed_at', email_confirmed_at
    ) as verification_data
from 
    admin_data;

select 
    'RLS Policies'::text as verification_type,
    json_build_object(
        'policyname', policyname,
        'cmd', cmd,
        'roles', roles,
        'using_clause', qual,
        'with_check_clause', with_check
    ) as verification_data
from 
    policy_data;

-- Additional verification as separate query
select 
    'Table Status'::text as verification_type,
    json_build_object(
        'table_exists', (
            select exists(
                select 1 
                from pg_tables 
                where schemaname = 'public' 
                and tablename = 'admin_users'
            )
        ),
        'rls_enabled', (
            select relpersistence 
            from pg_class 
            where relname = 'admin_users' 
            and relnamespace = 'public'::regnamespace
        )
    ) as verification_data; 