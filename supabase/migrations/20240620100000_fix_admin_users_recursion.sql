-- Fix infinite recursion in admin_users policies
-- This migration addresses the issue where admin_users policies create an infinite recursion

-- Step 1: Drop problematic policies that cause recursion
DROP POLICY IF EXISTS "Admin Login Lookup" ON public.admin_users;
DROP POLICY IF EXISTS "Admin Write Access" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;

-- Step 2: Create simplified policies that avoid recursion
-- This policy allows anyone to read admin_users for basic authentication only
CREATE POLICY "Simple admin authentication lookup"
ON public.admin_users
FOR SELECT
TO authenticated, anon
USING (true);

-- This policy restricts writes to authenticated users with specific emails
CREATE POLICY "Super admin write access"
ON public.admin_users
FOR UPDATE
TO authenticated
USING (
  auth.email() IN ('sokoclick.com@gmail.com', 'pushns24@gmail.com')
);

-- Step 3: Create a function to get available slots that bypasses RLS
CREATE OR REPLACE FUNCTION public.get_available_slots()
RETURNS SETOF int
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id 
  FROM auction_slots 
  WHERE product_id IS NULL
  ORDER BY id;
$$;

-- Grant execute permission to authenticated users and anon
GRANT EXECUTE ON FUNCTION public.get_available_slots() TO authenticated, anon;

-- Step 4: Add a comment to the function for documentation
COMMENT ON FUNCTION public.get_available_slots IS 'Returns IDs of available slots, bypassing RLS policies to avoid recursion issues'; 