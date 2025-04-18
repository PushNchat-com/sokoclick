-- Migration: Fix infinite recursion in users table RLS policies
-- Description: Replace recursive RLS policies with safer alternatives

-- Drop problematic policies
DROP POLICY IF EXISTS "Only admins can update user roles" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Create safer policies using auth.jwt() to check roles
-- This avoids querying the users table recursively

-- Policy for admin role updates (uses jwt claim instead of querying the table)
CREATE POLICY "Only admins can update roles" 
ON public.users
FOR UPDATE
USING (
  (auth.jwt() ->> 'role')::text = 'admin'
)
WITH CHECK (
  (auth.jwt() ->> 'role')::text = 'admin'
);

-- Policy for users to update their own profiles
CREATE POLICY "Users can update own profiles" 
ON public.users
FOR UPDATE
USING (
  auth.uid() = id AND (
    -- Cannot update their own role
    (auth.jwt() ->> 'role')::text = 'admin' OR
    'role' <> ALL (SELECT jsonb_object_keys(jsonb_strip_nulls(jsonb_build_object('role', role))))
  )
);

-- Create a safer function to update user roles
CREATE OR REPLACE FUNCTION public.update_user_role(user_id UUID, new_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Get the role from JWT directly instead of querying the table
  current_user_role := auth.jwt() ->> 'role';
  
  -- Check if the calling user is an admin
  IF current_user_role = 'admin' THEN
    -- First update the users table
    UPDATE public.users
    SET role = new_role
    WHERE id = user_id;
    
    -- Then update the auth metadata
    UPDATE auth.users
    SET raw_user_meta_data = 
      jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{role}',
        to_jsonb(new_role)
      )
    WHERE id = user_id;
    
    RETURN TRUE;
  ELSE
    RAISE EXCEPTION 'Only admins can update user roles.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 