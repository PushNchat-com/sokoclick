-- Diagnostic script to check user roles
-- Shows role mismatches between auth.users metadata and public.users table

-- Create a simplified diagnostic function
CREATE OR REPLACE FUNCTION public.diagnose_user_roles()
RETURNS TABLE (
  id UUID,
  email TEXT,
  users_role TEXT,
  auth_role TEXT,
  is_synced BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.role AS users_role,
    (a.raw_user_meta_data->>'role')::TEXT AS auth_role,
    (u.role = (a.raw_user_meta_data->>'role')::TEXT) AS is_synced
  FROM 
    public.users u
  JOIN 
    auth.users a ON u.id = a.id
  ORDER BY 
    is_synced ASC, 
    email ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Return direct query results instead of calling function
-- This is simpler and more likely to return usable results
SELECT 
  u.id,
  u.email,
  u.role AS users_role,
  (a.raw_user_meta_data->>'role')::TEXT AS auth_role,
  (u.role = (a.raw_user_meta_data->>'role')::TEXT) AS is_synced
FROM 
  public.users u
JOIN 
  auth.users a ON u.id = a.id
ORDER BY 
  (u.role = (a.raw_user_meta_data->>'role')::TEXT) ASC, 
  u.email ASC;

-- Check RLS policies on the users table
SELECT 
  pc.relname AS table_name,
  pp.policyname AS policy_name,
  pp.cmd AS operation,
  pp.qual AS using_expression,
  pp.with_check AS with_check_expression
FROM 
  pg_policy pp
JOIN 
  pg_class pc ON pp.polrelid = pc.oid
WHERE 
  pc.relname = 'users';

-- Check the update_user_role function
SELECT 
  proname AS function_name, 
  prosrc AS function_definition
FROM 
  pg_proc 
WHERE 
  proname = 'update_user_role';

-- Find all users with role 'seller' in either table
SELECT 
  u.id,
  u.email,
  u.role AS users_role,
  (a.raw_user_meta_data->>'role')::TEXT AS auth_role
FROM 
  public.users u
JOIN 
  auth.users a ON u.id = a.id
WHERE 
  u.role = 'seller' OR (a.raw_user_meta_data->>'role')::TEXT = 'seller';

-- Check schema of users table to confirm columns
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' 
  AND table_name = 'users'
ORDER BY 
  ordinal_position; 