-- Description: Fix admin permissions for existing users
-- This script ensures that admin users have the correct role in the admin_users table
-- and fixes any authentication-related issues

-- First, create a function to fix admin user permissions
create or replace function public.fix_admin_user_permissions(
  p_email text,
  p_role text default 'super_admin'
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_auth_user_id uuid;
  v_admin_exists boolean;
  v_result text;
begin
  -- Check if user exists in auth.users
  select id into v_auth_user_id
  from auth.users
  where email = p_email;
  
  if v_auth_user_id is null then
    return 'User ' || p_email || ' does not exist in auth.users';
  end if;
  
  -- Check if user exists in admin_users
  select exists(
    select 1 from public.admin_users where email = p_email
  ) into v_admin_exists;
  
  -- Update or insert record in admin_users
  if v_admin_exists then
    update public.admin_users
    set 
      id = v_auth_user_id,
      role = p_role,
      permissions = case p_role
        when 'super_admin' then array[
          'products:read', 'products:write', 'products:delete', 'products:approve',
          'users:read', 'users:write', 'users:delete', 'users:verify',
          'slots:read', 'slots:write', 'slots:delete',
          'analytics:read', 'analytics:export',
          'settings:read', 'settings:write'
        ]
        else array[]::text[]
      end,
      updated_at = now()
    where email = p_email;
    
    v_result = 'Updated existing admin user: ' || p_email || ' with role: ' || p_role;
  else
    insert into public.admin_users (
      id,
      email,
      name,
      role,
      permissions,
      last_login,
      created_at,
      updated_at
    )
    values (
      v_auth_user_id,
      p_email,
      split_part(p_email, '@', 1),
      p_role,
      case p_role
        when 'super_admin' then array[
          'products:read', 'products:write', 'products:delete', 'products:approve',
          'users:read', 'users:write', 'users:delete', 'users:verify',
          'slots:read', 'slots:write', 'slots:delete',
          'analytics:read', 'analytics:export',
          'settings:read', 'settings:write'
        ]
        else array[]::text[]
      end,
      now(),
      now(),
      now()
    );
    
    v_result = 'Created new admin user: ' || p_email || ' with role: ' || p_role;
  end if;
  
  return v_result;
end;
$$;

-- Execute fix for the admin users
do $$
declare
  result1 text;
  result2 text;
begin
  select public.fix_admin_user_permissions('sokoclick.com@gmail.com', 'super_admin') into result1;
  select public.fix_admin_user_permissions('pushns24@gmail.com', 'super_admin') into result2;
  
  raise notice 'Fix results: %', result1;
  raise notice 'Fix results: %', result2;
end
$$;

-- Verify the admin users now have the correct permissions
do $$
declare
  admin_count integer;
  admin_emails text[];
begin
  select count(*), array_agg(email)
  into admin_count, admin_emails
  from public.admin_users
  where role = 'super_admin' and email in ('sokoclick.com@gmail.com', 'pushns24@gmail.com');
  
  if admin_count = 2 then
    raise notice 'Verification succeeded: Both admin users have super_admin role: %', admin_emails;
  else
    raise warning 'Verification failed: Not all admin users have super_admin role. Found: %', admin_emails;
  end if;
end
$$;

-- Clean up
drop function if exists public.fix_admin_user_permissions(text, text); 