-- Migration to create the core schema for a new project (slot-centric)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for idempotency on initial runs)
DROP TABLE IF EXISTS public.analytics_events;
DROP TABLE IF EXISTS public.auction_slots;
DROP TABLE IF EXISTS public.users;

-- Create users table (simplified for sellers/admins initially)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'seller', 'admin')),
    whatsapp_number TEXT UNIQUE, -- Unique if present, required for sellers
    name TEXT,
    email TEXT UNIQUE,
    location TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_level TEXT CHECK (verification_level IN ('basic', 'complete')),
    verification_date TIMESTAMPTZ,
    joined_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.users IS 'Stores user information for customers, sellers, and admins.';
COMMENT ON COLUMN public.users.role IS 'User role: customer, seller, or admin.';
COMMENT ON COLUMN public.users.whatsapp_number IS 'Primary contact method for sellers (must be unique if set).';
COMMENT ON COLUMN public.users.verification_level IS 'Level of seller verification.';
COMMENT ON COLUMN public.users.verification_date IS 'Date seller verification was completed.';

-- Function/Trigger for users table updated_at
DROP FUNCTION IF EXISTS public.trigger_set_user_timestamp();
CREATE OR REPLACE FUNCTION public.trigger_set_user_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS set_user_timestamp ON public.users;
CREATE TRIGGER set_user_timestamp
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_user_timestamp();

-- Create the refactored auction_slots table
CREATE TABLE public.auction_slots (
    -- Core Slot Identity
    id INTEGER PRIMARY KEY CHECK (id BETWEEN 1 AND 25),

    -- Live Product Details
    live_product_seller_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    live_product_name_en TEXT,
    live_product_name_fr TEXT,
    live_product_description_en TEXT,
    live_product_description_fr TEXT,
    live_product_price NUMERIC(10, 2),
    live_product_currency TEXT CHECK (live_product_currency IN ('XAF', 'USD', 'EUR')),
    live_product_categories TEXT[],
    live_product_delivery_options JSONB,
    live_product_tags TEXT[],
    live_product_image_urls TEXT[],

    -- Slot Operational State
    slot_status TEXT NOT NULL DEFAULT 'empty' CHECK (slot_status IN ('empty', 'live', 'maintenance')),
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    featured BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,

    -- Draft Product Details
    draft_seller_whatsapp_number TEXT,
    draft_product_name_en TEXT,
    draft_product_name_fr TEXT,
    draft_product_description_en TEXT,
    draft_product_description_fr TEXT,
    draft_product_price NUMERIC(10, 2),
    draft_product_currency TEXT CHECK (draft_product_currency IN ('XAF', 'USD', 'EUR')),
    draft_product_categories TEXT[],
    draft_product_delivery_options JSONB,
    draft_product_tags TEXT[],
    draft_product_image_urls TEXT[],
    draft_status TEXT NOT NULL DEFAULT 'empty' CHECK (draft_status IN ('empty', 'drafting', 'ready_to_publish')),
    draft_updated_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments for auction_slots
COMMENT ON TABLE public.auction_slots IS 'Stores data for the 25 fixed auction slots, including live and draft product details.';
COMMENT ON COLUMN public.auction_slots.id IS 'Unique slot identifier (1-25).';
COMMENT ON COLUMN public.auction_slots.live_product_seller_id IS 'Seller owning the currently live product (references users table).';
COMMENT ON COLUMN public.auction_slots.draft_seller_whatsapp_number IS 'WhatsApp number of the seller associated with the current draft content.';
COMMENT ON COLUMN public.auction_slots.live_product_name_en IS 'English name of the live product.';
COMMENT ON COLUMN public.auction_slots.live_product_name_fr IS 'French name of the live product.';
COMMENT ON COLUMN public.auction_slots.slot_status IS 'Current status of the slot: empty, live (with a product), maintenance.';
COMMENT ON COLUMN public.auction_slots.start_time IS 'Timestamp when the current live product display started.';
COMMENT ON COLUMN public.auction_slots.end_time IS 'Timestamp when the current live product display is scheduled to end.';
COMMENT ON COLUMN public.auction_slots.draft_product_name_en IS 'English name of the draft product being prepared.';
COMMENT ON COLUMN public.auction_slots.draft_status IS 'Status of the draft content: empty, drafting, ready_to_publish.';
COMMENT ON COLUMN public.auction_slots.draft_updated_at IS 'Timestamp of the last update to the draft content.';
COMMENT ON COLUMN public.auction_slots.updated_at IS 'Timestamp of the last update to this slot record.';

-- Function/Trigger for auction_slots updated_at
DROP FUNCTION IF EXISTS public.trigger_set_timestamp();
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS set_timestamp ON public.auction_slots;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.auction_slots
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Function/Trigger for auction_slots draft_updated_at
DROP FUNCTION IF EXISTS public.trigger_set_draft_timestamp();
CREATE OR REPLACE FUNCTION public.trigger_set_draft_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    NEW.draft_seller_whatsapp_number IS DISTINCT FROM OLD.draft_seller_whatsapp_number OR
    NEW.draft_product_name_en IS DISTINCT FROM OLD.draft_product_name_en OR
    NEW.draft_product_name_fr IS DISTINCT FROM OLD.draft_product_name_fr OR
    NEW.draft_product_description_en IS DISTINCT FROM OLD.draft_product_description_en OR
    NEW.draft_product_description_fr IS DISTINCT FROM OLD.draft_product_description_fr OR
    NEW.draft_product_price IS DISTINCT FROM OLD.draft_product_price OR
    NEW.draft_product_currency IS DISTINCT FROM OLD.draft_product_currency OR
    NEW.draft_product_categories IS DISTINCT FROM OLD.draft_product_categories OR
    NEW.draft_product_delivery_options IS DISTINCT FROM OLD.draft_product_delivery_options OR
    NEW.draft_product_tags IS DISTINCT FROM OLD.draft_product_tags OR
    NEW.draft_product_image_urls IS DISTINCT FROM OLD.draft_product_image_urls OR
    NEW.draft_status IS DISTINCT FROM OLD.draft_status
  ) THEN
    NEW.draft_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS set_draft_timestamp ON public.auction_slots;
CREATE TRIGGER set_draft_timestamp
BEFORE UPDATE ON public.auction_slots
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_draft_timestamp();


-- Initialize the 25 slots
INSERT INTO public.auction_slots (id, slot_status, draft_status)
SELECT i, 'empty', 'empty'
FROM generate_series(1, 25) AS i
ON CONFLICT (id) DO NOTHING;

-- Create analytics_events table
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  slot_id INTEGER REFERENCES public.auction_slots(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  session_id TEXT,
  whatsapp_contact BOOLEAN DEFAULT FALSE,
  language TEXT CHECK (language IN ('en', 'fr')),
  device_type TEXT,
  additional_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.analytics_events IS 'Tracks user interactions and system events for analytics.';
COMMENT ON COLUMN public.analytics_events.event_type IS 'Type of event being tracked.';
COMMENT ON COLUMN public.analytics_events.slot_id IS 'The auction slot related to the event, if any.';


-- Add necessary indexes
CREATE INDEX IF NOT EXISTS idx_auction_slots_status ON public.auction_slots(slot_status);
CREATE INDEX IF NOT EXISTS idx_auction_slots_draft_status ON public.auction_slots(draft_status);
CREATE INDEX IF NOT EXISTS idx_auction_slots_seller_id ON public.auction_slots(live_product_seller_id);
CREATE INDEX IF NOT EXISTS idx_auction_slots_end_time ON public.auction_slots(end_time);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_whatsapp ON public.users(whatsapp_number) WHERE whatsapp_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_slot_id ON public.analytics_events(slot_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events(created_at DESC);


-- is_admin function (checks users table)
DROP FUNCTION IF EXISTS public.is_admin();
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;


-- === RLS Setup ===

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users RLS Policies:
DROP POLICY IF EXISTS "Allow users to view their own profile" ON public.users;
CREATE POLICY "Allow users to view their own profile"
ON public.users FOR SELECT
TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.users;
CREATE POLICY "Allow users to update their own profile"
ON public.users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Allow admins full access to users" ON public.users;
CREATE POLICY "Allow admins full access to users"
ON public.users FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Allow anon/public to see basic seller info? (Optional - Needed if showing seller name on cards)
-- DROP POLICY IF EXISTS "Allow public view of seller info" ON public.users;
-- CREATE POLICY "Allow public view of seller info"
-- ON public.users FOR SELECT
-- TO anon, authenticated
-- USING (role = 'seller');

-- Enable RLS on auction_slots table
ALTER TABLE public.auction_slots ENABLE ROW LEVEL SECURITY;

-- Auction Slots RLS Policies:
DROP POLICY IF EXISTS "Allow public read access to live slots" ON public.auction_slots;
CREATE POLICY "Allow public read access to live slots"
ON public.auction_slots FOR SELECT
TO anon, authenticated
USING (slot_status = 'live');

DROP POLICY IF EXISTS "Allow admins full access to slots" ON public.auction_slots;
CREATE POLICY "Allow admins full access to slots"
ON public.auction_slots FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Enable RLS on analytics_events table (Example - adjust as needed)
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Analytics RLS Policies:
DROP POLICY IF EXISTS "Allow admins read access to analytics" ON public.analytics_events;
CREATE POLICY "Allow admins read access to analytics"
ON public.analytics_events FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Allow users insert own analytics" ON public.analytics_events;
CREATE POLICY "Allow users insert own analytics"
ON public.analytics_events FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- === Grants ===
GRANT SELECT ON public.users TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.users TO authenticated;

GRANT SELECT ON public.auction_slots TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.auction_slots TO authenticated;

GRANT SELECT ON public.analytics_events TO authenticated;
GRANT INSERT ON public.analytics_events TO anon, authenticated; 