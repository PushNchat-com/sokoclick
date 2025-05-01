-- Add a simple ping function for connection testing
DROP FUNCTION IF EXISTS public.ping();
CREATE OR REPLACE FUNCTION public.ping()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'timestamp', now(),
    'status', 'ok',
    'message', 'Connection successful'
  );
$$;

-- Grant execution permission to all authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.ping() TO authenticated, anon;

COMMENT ON FUNCTION public.ping IS 'Simple function to test Supabase connectivity'; 