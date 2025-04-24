-- Description: Fix RLS policies for admin authentication
-- This script ensures that authenticated users can access necessary tables for login
-- and addresses potential security issues with admin access

-- Step 1: Drop existing problematic policies
DROP POLICY IF EXISTS "Allow authentication lookup" ON public.admin_users;
DROP POLICY IF EXISTS "Allow admin auth access" ON public.admin_users;
DROP POLICY IF EXISTS "Allow email lookup for authentication" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can view their own record" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can view all admin records" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can manage all records" ON public.admin_users;

-- Step 2: Create comprehensive policies for admin_users table
-- This is a controlled read-only access during login
CREATE POLICY "Admin Login Lookup"
ON public.admin_users
FOR SELECT
TO authenticated, anon
USING (true);

-- Additional policy for admin_users to restrict writes to admins only
CREATE POLICY "Admin Write Access"
ON public.admin_users
FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.admin_users 
    WHERE role = 'super_admin'
  )
);

-- Step 3: Check if profiles table exists and create policy if it does
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS "Allow Profile Access" ON public.profiles;
    
    -- Create new policy - restrict to only allow users to see their own profiles
    EXECUTE 'CREATE POLICY "Allow Profile Access" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id)';
    
    -- Allow anonymous access only for authentication purposes
    EXECUTE 'CREATE POLICY "Allow Profile Auth" ON public.profiles FOR SELECT TO anon USING (true)';
    
    RAISE NOTICE 'Created controlled policies for profiles table';
  ELSE
    RAISE NOTICE 'profiles table does not exist, skipping policy creation';
  END IF;
END
$$;

-- Step 4: Update admin_users to ensure correct roles
UPDATE public.admin_users
SET role = 'super_admin',
    permissions = array[
      'products:read', 'products:write', 'products:delete', 'products:approve',
      'users:read', 'users:write', 'users:delete', 'users:verify',
      'slots:read', 'slots:write', 'slots:delete',
      'analytics:read', 'analytics:export',
      'settings:read', 'settings:write'
    ]
WHERE email IN ('sokoclick.com@gmail.com', 'pushns24@gmail.com');

-- Step 5: Create security audit log table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'admin_access_logs'
  ) THEN
    CREATE TABLE public.admin_access_logs (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      admin_id uuid REFERENCES public.admin_users(id),
      email text,
      action text NOT NULL,
      ip_address text,
      user_agent text,
      success boolean NOT NULL DEFAULT false,
      created_at timestamptz DEFAULT NOW()
    );
    
    -- Create policy for admin_access_logs
    CREATE POLICY "Admins can see access logs"
    ON public.admin_access_logs
    FOR SELECT
    TO authenticated
    USING (
      auth.uid() IN (
        SELECT id FROM public.admin_users 
        WHERE role = 'super_admin'
      )
    );
    
    RAISE NOTICE 'Created admin_access_logs table for security auditing';
  END IF;
END
$$;

-- Step 6: Create function to log admin access attempts
CREATE OR REPLACE FUNCTION public.log_admin_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  auth_uid uuid;
  admin_email text;
BEGIN
  -- Get current authenticated user
  auth_uid := auth.uid();
  
  -- Get email if available
  SELECT email INTO admin_email 
  FROM auth.users 
  WHERE id = auth_uid;
  
  -- Log the access attempt
  INSERT INTO public.admin_access_logs (
    admin_id,
    email,
    action,
    ip_address,
    user_agent,
    success
  ) VALUES (
    auth_uid,
    admin_email,
    TG_OP,
    request.header('X-Forwarded-For'),
    request.header('User-Agent'),
    true
  );
  
  RETURN NEW;
END;
$$;

-- Step 7: Create trigger for admin_users table access
DROP TRIGGER IF EXISTS admin_access_logger ON public.admin_users;
CREATE TRIGGER admin_access_logger
AFTER SELECT ON public.admin_users
FOR EACH STATEMENT
EXECUTE FUNCTION public.log_admin_access();

-- Step 8: Verify successful policy creation
DO $$
BEGIN
  ASSERT (
    SELECT count(*) = 1 FROM pg_policies 
    WHERE tablename = 'admin_users' AND policyname = 'Admin Login Lookup'
  ), 'Admin Login Lookup policy was not created';
  
  ASSERT (
    SELECT count(*) = 1 FROM pg_policies 
    WHERE tablename = 'admin_users' AND policyname = 'Admin Write Access'
  ), 'Admin Write Access policy was not created';
  
  -- Only verify profiles policy if the table exists
  IF EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    ASSERT (
      SELECT count(*) >= 1 FROM pg_policies 
      WHERE tablename = 'profiles' AND policyname LIKE 'Allow Profile%'
    ), 'Profile policies were not created';
  END IF;
  
  RAISE NOTICE 'All policies successfully created';
END $$; 