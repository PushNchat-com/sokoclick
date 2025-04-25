-- Fix RLS policies for admin data access
-- This script addresses 500 errors on admin_audit_logs, analytics_events and users tables

-- 1. Fix admin_audit_logs policies
DROP POLICY IF EXISTS "Allow admins to read admin_audit_logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "Allow users to insert admin_audit_logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "Super admins can view all audit logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "Super admins can insert audit logs" ON public.admin_audit_logs;

-- Create simplified policy for reading audit logs
CREATE POLICY "Admin read audit logs" 
ON public.admin_audit_logs
FOR SELECT 
TO authenticated
USING (
  (SELECT auth.uid()) IN (
    SELECT id FROM public.admin_users
  )
);

-- Create simplified policy for writing audit logs
CREATE POLICY "Admin write audit logs" 
ON public.admin_audit_logs
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- 2. Fix analytics_events policies
DROP POLICY IF EXISTS "Admin users can view analytics" ON public.analytics_events;

-- Create simplified policy for reading analytics events
CREATE POLICY "Admin read analytics" 
ON public.analytics_events
FOR SELECT 
TO authenticated
USING (
  (SELECT auth.uid()) IN (
    SELECT id FROM public.admin_users
  )
);

-- Keep the existing policy for inserting analytics events
-- But let's ensure there's no issue with it
DROP POLICY IF EXISTS "Anyone can create analytics events" ON public.analytics_events;

CREATE POLICY "Anyone can create analytics events" 
ON public.analytics_events
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 3. Fix users table policies
-- If there are issues with access to users table
DROP POLICY IF EXISTS "Admin users can do everything with users" ON public.users;

CREATE POLICY "Admin users can access all users" 
ON public.users
FOR ALL
TO authenticated
USING (
  (SELECT auth.uid()) IN (
    SELECT id FROM public.admin_users
  )
);

-- 4. Create log_admin_action function if it doesn't exist
CREATE OR REPLACE FUNCTION public.log_admin_action(
  action_text text,
  resource_text text DEFAULT 'admin',
  resource_id_text text DEFAULT null,
  details_json jsonb DEFAULT null
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.admin_audit_logs (
    user_id,
    action,
    resource,
    resource_id,
    details,
    created_at
  ) VALUES (
    auth.uid(),
    action_text,
    resource_text,
    resource_id_text,
    details_json,
    now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 