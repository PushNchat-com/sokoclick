-- Migration: Fix user role type to constrain to specific values
-- Description: Ensures the role column is properly typed to avoid type errors

-- Create a temporary function to handle the type conversion safely
CREATE OR REPLACE FUNCTION public.fix_user_role_types()
RETURNS VOID AS $$
BEGIN
  -- Step 1: Check if the role column is a text/varchar type (we need to make it an enum type)
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'role' 
    AND (data_type = 'text' OR data_type = 'character varying')
  ) THEN
    -- Step 2: Check if the user_role_type enum already exists
    IF NOT EXISTS (
      SELECT 1
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typname = 'user_role_type'
      AND n.nspname = 'public'
    ) THEN
      -- Create the enum type if it doesn't exist
      CREATE TYPE public.user_role_type AS ENUM ('admin', 'seller', 'buyer');
    END IF;

    -- Step 3: Create a temporary column with the new type
    ALTER TABLE public.users 
    ADD COLUMN role_typed public.user_role_type;

    -- Step 4: Update the typed column with converted values
    UPDATE public.users 
    SET role_typed = 
      CASE
        WHEN role = 'admin' THEN 'admin'::public.user_role_type
        WHEN role = 'seller' THEN 'seller'::public.user_role_type
        WHEN role = 'buyer' OR role IS NULL THEN 'buyer'::public.user_role_type
        ELSE 'buyer'::public.user_role_type -- default to buyer for any invalid values
      END;

    -- Step 5: Drop the old column and rename the new one
    ALTER TABLE public.users 
    DROP COLUMN role,
    RENAME COLUMN role_typed TO role;
  END IF;

  -- Step 6: Ensure there's a trigger to sync role changes
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'sync_user_role_trigger'
  ) THEN
    -- Create the trigger to sync role changes to auth metadata
    CREATE TRIGGER sync_user_role_trigger
    AFTER UPDATE OF role ON public.users
    FOR EACH ROW
    WHEN (OLD.role IS DISTINCT FROM NEW.role)
    EXECUTE FUNCTION public.sync_user_role_with_auth();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function
SELECT public.fix_user_role_types();

-- Drop the temporary function
DROP FUNCTION public.fix_user_role_types();

-- Make sure the mng.celine@gmail.com user is a seller
UPDATE public.users
SET role = 'seller'::public.user_role_type
WHERE email = 'mng.celine@gmail.com';

-- Update the auth metadata
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"seller"'
)
WHERE email = 'mng.celine@gmail.com'; 