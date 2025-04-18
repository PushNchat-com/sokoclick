-- Migration: Add role synchronization between users table and auth metadata
-- Description: Creates a trigger function to automatically update auth.users metadata when role changes in users table

-- First, create the sync function
CREATE OR REPLACE FUNCTION public.sync_user_role_with_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user's role is updated in the users table
  -- also update the auth.users metadata
  UPDATE auth.users
  SET raw_user_meta_data = 
    jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{role}',
      to_jsonb(NEW.role)
    )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Then, create a trigger to run this function when roles change
DROP TRIGGER IF EXISTS sync_user_role_trigger ON public.users;
CREATE TRIGGER sync_user_role_trigger
AFTER UPDATE OF role ON public.users
FOR EACH ROW
WHEN (OLD.role IS DISTINCT FROM NEW.role)
EXECUTE FUNCTION public.sync_user_role_with_auth();

-- Create a stored procedure that can be called through RPC to update user roles
-- This is more secure than relying on RLS alone
CREATE OR REPLACE FUNCTION public.update_user_role(user_id UUID, new_role TEXT)
RETURNS VOID AS $$
BEGIN
  -- Check if the calling user is an admin
  IF EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    -- Update the user's role in the auth metadata directly
    UPDATE auth.users
    SET raw_user_meta_data = 
      jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{role}',
        to_jsonb(new_role)
      )
    WHERE id = user_id;
  ELSE
    RAISE EXCEPTION 'Only admins can update user roles.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optionally, run a one-time sync to ensure all existing users are in sync
DO $$
BEGIN
  -- One-time sync of all existing users
  UPDATE auth.users a
  SET raw_user_meta_data = jsonb_set(
    COALESCE(a.raw_user_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb(u.role)
  )
  FROM public.users u
  WHERE a.id = u.id
  AND (a.raw_user_meta_data->>'role' IS NULL OR a.raw_user_meta_data->>'role' <> u.role);
END $$; 