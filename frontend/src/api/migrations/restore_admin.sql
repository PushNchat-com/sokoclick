-- Migration: Restore admin privileges to system admin account
-- Description: This migration fixes the admin privileges for the main system account

-- First, ensure the user exists in the users table and has admin role
DO $$
BEGIN
  -- Update the users table
  UPDATE public.users
  SET role = 'admin'
  WHERE email = 'sokoclick.com@gmail.com';
  
  -- If the user is not in the users table, try to add them
  IF NOT FOUND THEN
    -- Try to find the user ID from auth.users
    DECLARE 
      admin_id UUID;
    BEGIN
      SELECT id INTO admin_id FROM auth.users WHERE email = 'sokoclick.com@gmail.com';
      
      IF admin_id IS NOT NULL THEN
        -- Insert the user into the users table with admin role
        INSERT INTO public.users (id, email, role, created_at, updated_at)
        VALUES (admin_id, 'sokoclick.com@gmail.com', 'admin', NOW(), NOW());
      END IF;
    END;
  END IF;
  
  -- Update the auth metadata directly for the user
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"admin"'
  )
  WHERE email = 'sokoclick.com@gmail.com';
END $$; 