-- Migration: Fix auction_state column and admin permissions
-- Description: Ensures auction_state column exists and admins can view all users

-- Add auction_state column if it doesn't exist
ALTER TABLE public.auction_slots 
  ADD COLUMN IF NOT EXISTS auction_state TEXT DEFAULT 'scheduled';

-- Add index for auction_state for better performance
CREATE INDEX IF NOT EXISTS idx_auction_slots_state ON public.auction_slots(auction_state);

-- Check if the policy already exists - if not, create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all users'
  ) THEN
    CREATE POLICY "Admins can view all users" 
    ON public.users
    FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE auth.uid() = auth.users.id 
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
      )
    );
  END IF;
END
$$; 