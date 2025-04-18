-- Migration: User Role RLS Policies
-- Description: Add RLS policies to ensure only admins can update user roles

-- First ensure RLS is enabled on the users table
alter table public.users enable row level security;

-- Policy: Only admins can update user roles
create policy "Only admins can update user roles" 
on public.users
for update 
using (
  exists (
    select 1 
    from auth.users 
    where auth.uid() = auth.users.id 
    and auth.users.raw_user_meta_data->>'role' = 'admin'
  )
)
with check (
  exists (
    select 1 
    from auth.users 
    where auth.uid() = auth.users.id 
    and auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Policy: Users can view other users' public information
create policy "Users can view other users' public information"
on public.users
for select
using (true);

-- Policy: Users can update their own profile
create policy "Users can update their own profile"
on public.users
for update
using (auth.uid() = id)
with check (
  auth.uid() = id
  and (
    -- Cannot update their own role unless they're an admin
    role is null
    or role = (select users.role from public.users where id = auth.uid())
    or exists (
      select 1 
      from auth.users 
      where auth.uid() = auth.users.id 
      and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
);

-- Function to synchronize Supabase auth metadata role with users table role
create or replace function public.sync_user_role()
returns trigger as $$
begin
  -- When role is updated in users table
  if new.role is distinct from old.role then
    -- Update auth.users metadata with the new role
    update auth.users
    set raw_user_meta_data = 
      jsonb_set(
        coalesce(raw_user_meta_data, '{}'::jsonb),
        '{role}',
        to_jsonb(new.role)
      )
    where id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to run function after user role updates
drop trigger if exists on_user_role_update on public.users;
create trigger on_user_role_update
after update on public.users
for each row
when (old.role is distinct from new.role)
execute procedure public.sync_user_role();

-- Function to handle new user creation and role sync from auth to DB
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Get role from auth metadata or default to 'buyer'
  declare
    role_from_auth text;
  begin
    select raw_user_meta_data->>'role' into role_from_auth from auth.users where id = new.id;
    
    if role_from_auth is null then
      role_from_auth := 'buyer';
    end if;
    
    -- Ensure the user has a role in the users table
    update public.users
    set role = role_from_auth
    where id = new.id and (role is null or role = '');
  end;
  
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user handling
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user(); 