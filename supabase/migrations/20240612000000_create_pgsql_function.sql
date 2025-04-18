-- Migration: Create pgSQL function for application-based migrations
-- Description: Creates a function that allows executing SQL queries from the application

-- First, create the pgSQL function to execute SQL queries 
create or replace function public.pgSQL(query text)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  execute query;
  return json_build_object('success', true);
exception
  when others then
    return json_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.pgSQL to authenticated;

-- Add comment explaining the function's purpose and security implications
comment on function public.pgSQL is 
  'Executes SQL queries passed from the application. SECURITY DEFINER allows execution with elevated permissions.'; 