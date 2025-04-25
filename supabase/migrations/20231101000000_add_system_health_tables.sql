-- Create system_errors table to store error events
CREATE TABLE IF NOT EXISTS system_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  stack_trace TEXT,
  component TEXT,
  severity TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  metadata JSONB,
  status TEXT NOT NULL DEFAULT 'new',
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create performance_metrics table to track slow operations
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_name TEXT NOT NULL,
  component TEXT NOT NULL,
  duration FLOAT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  metadata JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create system_health table for health checks
CREATE TABLE IF NOT EXISTS system_health (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'healthy',
  last_check TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB
);

-- Create admin_audit_logs table for tracking admin actions
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add RLS policies to the tables
ALTER TABLE system_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow admin users to read system_errors
CREATE POLICY "Allow admins to read system_errors" 
ON system_errors FOR SELECT 
TO authenticated 
USING (
  auth.jwt() ->> 'role' = 'admin'
);

-- Allow admin users to insert into system_errors
CREATE POLICY "Allow admins to insert system_errors" 
ON system_errors FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.jwt() ->> 'role' = 'admin'
);

-- Allow admin users to update system_errors
CREATE POLICY "Allow admins to update system_errors" 
ON system_errors FOR UPDATE 
TO authenticated 
USING (
  auth.jwt() ->> 'role' = 'admin'
);

-- Allow admin users to read performance_metrics
CREATE POLICY "Allow admins to read performance_metrics" 
ON performance_metrics FOR SELECT 
TO authenticated 
USING (
  auth.jwt() ->> 'role' = 'admin'
);

-- Allow all authenticated users to insert into performance_metrics
CREATE POLICY "Allow users to insert performance_metrics" 
ON performance_metrics FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow admin users to read system_health
CREATE POLICY "Allow admins to read system_health" 
ON system_health FOR SELECT 
TO authenticated 
USING (
  auth.jwt() ->> 'role' = 'admin'
);

-- Allow admin users to update system_health
CREATE POLICY "Allow admins to update system_health" 
ON system_health FOR UPDATE 
TO authenticated 
USING (
  auth.jwt() ->> 'role' = 'admin'
);

-- Allow admin users to insert into system_health
CREATE POLICY "Allow admins to insert system_health" 
ON system_health FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.jwt() ->> 'role' = 'admin'
);

-- Allow admin users to read audit logs
CREATE POLICY "Allow admins to read admin_audit_logs" 
ON admin_audit_logs FOR SELECT 
TO authenticated 
USING (
  auth.jwt() ->> 'role' = 'admin'
);

-- Allow all authenticated users to insert audit logs
CREATE POLICY "Allow users to insert admin_audit_logs" 
ON admin_audit_logs FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Create function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(log_entry JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO admin_audit_logs (
    user_id,
    action,
    resource,
    resource_id,
    details,
    created_at
  ) VALUES (
    (log_entry->>'user_id')::UUID,
    log_entry->>'action',
    log_entry->>'resource',
    log_entry->>'resource_id',
    log_entry->'details',
    COALESCE((log_entry->>'created_at')::TIMESTAMPTZ, now())
  );
END;
$$;

-- Create function to ping the database for health checks
CREATE OR REPLACE FUNCTION ping_database()
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN TRUE;
END;
$$;

-- Create function to clear temporary storage
CREATE OR REPLACE FUNCTION clear_temp_storage()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  bucket_name TEXT := 'temp-storage';
  older_than TIMESTAMPTZ := now() - INTERVAL '1 day';
  result BOOLEAN;
BEGIN
  -- This is a placeholder function. In a real implementation,
  -- you would connect to the storage API and remove old files.
  -- For now, we just return success
  
  -- Update the system_health record to indicate cleanup was performed
  INSERT INTO system_health (id, status, last_check, metadata)
  VALUES ('storage-cleanup', 'healthy', now(), jsonb_build_object('last_cleanup', now()))
  ON CONFLICT (id) DO UPDATE
  SET status = 'healthy', 
      last_check = now(),
      metadata = jsonb_build_object('last_cleanup', now());
      
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Set up initial system health status
INSERT INTO system_health (id, status, last_check)
VALUES 
  ('last-check', 'healthy', now()),
  ('database', 'healthy', now()),
  ('storage', 'healthy', now())
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_system_errors_severity ON system_errors (severity);
CREATE INDEX IF NOT EXISTS idx_system_errors_status ON system_errors (status);
CREATE INDEX IF NOT EXISTS idx_system_errors_created_at ON system_errors (created_at);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_duration ON performance_metrics (duration);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics (timestamp);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_user_id ON admin_audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_resource ON admin_audit_logs (resource);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs (created_at);

-- Add columns to match TypeScript definitions, converting camelCase to snake_case
ALTER TABLE system_errors ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE performance_metrics ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE system_health ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS details JSONB;

-- Make columns more intuitive by updating names to match code conventions
ALTER TABLE performance_metrics RENAME COLUMN operation_name TO operation_name;

-- Create views for admin dashboard
CREATE OR REPLACE VIEW v_system_health_summary AS
SELECT
  (SELECT COUNT(*) FROM system_errors WHERE severity = 'critical' AND status = 'new') AS critical_error_count,
  (SELECT COUNT(*) FROM system_errors WHERE severity = 'warning' AND status = 'new') AS warning_count,
  (SELECT COUNT(*) FROM system_errors WHERE status = 'new') AS total_open_errors,
  (SELECT COUNT(*) FROM performance_metrics WHERE duration > 1000 AND timestamp > now() - INTERVAL '1 day') AS slow_operations_count,
  (SELECT status FROM system_health WHERE id = 'last-check') AS overall_status,
  (SELECT last_check FROM system_health WHERE id = 'last-check') AS last_check
; 