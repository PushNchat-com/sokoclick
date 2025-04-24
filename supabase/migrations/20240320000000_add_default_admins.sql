-- Description: Add default admin users to the platform
-- Following cursor rules for SQL migrations:
-- 1. Use lowercase for SQL keywords
-- 2. Include public schema prefix
-- 3. Make migration idempotent
-- 4. Add clear comments

-- First, ensure the admin_users table exists and has the correct schema
do $$
begin
  if not exists (
    select from pg_tables
    where schemaname = 'public'
    and tablename = 'admin_users'
  ) then
    raise exception 'public.admin_users table does not exist. Please run the initial schema migration first.';
  end if;
end
$$;

-- Function to safely insert admin users
create or replace function public.insert_admin_user(
  p_email text,
  p_role text default 'super_admin'
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  -- Get the user ID from auth.users
  select id into v_user_id
  from auth.users
  where email = p_email;

  -- If user exists in auth.users, insert into admin_users
  if v_user_id is not null then
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
      v_user_id,
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
    )
    on conflict (email) do update set
      id = v_user_id,
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
      updated_at = now();
  end if;
end;
$$;

-- Add default admin users
select public.insert_admin_user('sokoclick.com@gmail.com');
select public.insert_admin_user('pushns24@gmail.com');

-- Drop the function as it's no longer needed
drop function if exists public.insert_admin_user(text, text);

-- Verify admin users were added
do $$
declare
  admin_count int;
begin
  select count(*) into admin_count
  from public.admin_users
  where email in ('sokoclick.com@gmail.com', 'pushns24@gmail.com');
  
  if admin_count < 2 then
    raise warning 'Not all admin users were added successfully. Please check auth.users table to ensure the email addresses exist.';
  end if;
end
$$; 