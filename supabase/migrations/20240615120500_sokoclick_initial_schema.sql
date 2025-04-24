-- Migration: 20240615120500_sokoclick_initial_schema.sql
-- Description: Initial database schema for SokoClick platform
-- Creates tables, functions, and RLS policies for the core e-commerce functionality

-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

--------------------------------------------------------------------------------
-- TABLES
--------------------------------------------------------------------------------

-- Users/Sellers table
create table public.users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  whatsapp_number text not null unique check (whatsapp_number ~ '^\+[0-9]{1,15}$'),
  email text unique check (email ~* '^.+@.+\..+$'),
  location text not null,
  is_verified boolean default false,
  verification_level text check (verification_level in ('basic', 'complete')),
  verification_date timestamptz,
  joined_date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.users is 'Stores information about sellers who list products on SokoClick; each seller is identified by their unique WhatsApp number';

-- Products table
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  name_en text not null,
  name_fr text not null,
  description_en text,
  description_fr text,
  price decimal(10, 2) not null check (price > 0),
  currency text not null check (currency in ('XAF', 'FCFA')),
  image_urls text[] not null check (array_length(image_urls, 1) > 0),
  category text,
  condition text check (condition in ('new', 'used', 'refurbished')),
  seller_id uuid not null references public.users(id) on delete cascade,
  seller_whatsapp text not null,
  status text not null check (status in ('pending', 'approved', 'rejected', 'inactive')),
  auction_slot_id integer unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.products is 'Stores product listings with bilingual support (English/French) and references to sellers via WhatsApp';

-- Auction slots table (25 fixed slots)
create table public.auction_slots (
  id integer primary key check (id between 1 and 25),
  product_id uuid references public.products(id) on delete set null,
  is_active boolean default false,
  start_time timestamptz,
  end_time timestamptz,
  featured boolean default false,
  view_count integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (is_active = true and product_id is not null and start_time is not null and end_time is not null) or
    (is_active = false)
  )
);
comment on table public.auction_slots is 'The 25 dedicated product slots that are the core of SokoClick platform; each slot can be assigned to one product at a time';

-- Delivery options table
create table public.delivery_options (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  name_en text not null,
  name_fr text not null,
  areas text[],
  estimated_days integer not null check (estimated_days > 0),
  fee decimal(10, 2) default 0 check (fee >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.delivery_options is 'Delivery options for products with bilingual support and fee information';

-- Product attributes table
create table public.product_attributes (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  value text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.product_attributes is 'Custom attributes for products to provide additional details';

-- Admin users table
create table public.admin_users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null check (email ~* '^.+@.+\..+$'),
  name text not null,
  role text not null check (role in ('super_admin', 'content_moderator', 'analytics_viewer', 'customer_support')),
  permissions text[],
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.admin_users is 'Administrative users with role-based permissions for platform management';

-- Analytics events table
create table public.analytics_events (
  id uuid primary key default uuid_generate_v4(),
  event_type text not null,
  slot_id integer references public.auction_slots(id),
  product_id uuid references public.products(id),
  whatsapp_contact boolean default false,
  language text check (language in ('en', 'fr')),
  device_type text,
  ip_address text,
  user_agent text,
  referrer text,
  additional_data jsonb,
  created_at timestamptz not null default now()
);
comment on table public.analytics_events is 'Tracks user interactions with products, slots, and WhatsApp engagements for analytics';

-- Promotional banners table
create table public.promotional_banners (
  id uuid primary key default uuid_generate_v4(),
  content_en text not null,
  content_fr text not null,
  active boolean default true,
  background_color text,
  text_color text,
  link text,
  start_date timestamptz not null,
  end_date timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_date < end_date)
);
comment on table public.promotional_banners is 'Optional promotional announcements displayed on the home page with bilingual support';

-- Initialization of 25 auction slots
insert into public.auction_slots (id, is_active, created_at, updated_at)
select i, false, now(), now()
from generate_series(1, 25) as i
on conflict (id) do nothing;

--------------------------------------------------------------------------------
-- INDEXES
--------------------------------------------------------------------------------

-- Users table indexes
create index users_whatsapp_number_idx on public.users (whatsapp_number);
create index users_verification_status_idx on public.users (is_verified, verification_level);

-- Products table indexes
create index products_status_idx on public.products (status);
create index products_seller_id_idx on public.products (seller_id);
create index products_seller_whatsapp_idx on public.products (seller_whatsapp);
create index products_category_idx on public.products (category);
create index products_auction_slot_idx on public.products (auction_slot_id);

-- Auction slots table indexes
create index auction_slots_product_id_idx on public.auction_slots (product_id);
create index auction_slots_active_status_idx on public.auction_slots (is_active);
create index auction_slots_time_range_idx on public.auction_slots (start_time, end_time);

-- Analytics events table indexes
create index analytics_events_event_type_idx on public.analytics_events (event_type);
create index analytics_events_slot_id_idx on public.analytics_events (slot_id);
create index analytics_events_product_id_idx on public.analytics_events (product_id);
create index analytics_events_created_at_idx on public.analytics_events (created_at);

--------------------------------------------------------------------------------
-- FUNCTIONS
--------------------------------------------------------------------------------

-- Function to update timestamp
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Function to increment view count for slots
create or replace function public.increment_slot_view_count(slot_id integer)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.auction_slots
  set view_count = view_count + 1
  where id = slot_id;
end;
$$;

-- Function to log product view events
create or replace function public.log_product_view(
  p_slot_id integer,
  p_product_id uuid,
  p_language text default 'en',
  p_device_type text default null,
  p_user_agent text default null,
  p_ip_address text default null,
  p_referrer text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  event_id uuid;
begin
  -- Increment view count
  perform public.increment_slot_view_count(p_slot_id);
  
  -- Log the view event
  insert into public.analytics_events (
    event_type,
    slot_id,
    product_id,
    language,
    device_type,
    user_agent,
    ip_address,
    referrer,
    created_at
  ) values (
    'product_view',
    p_slot_id,
    p_product_id,
    p_language,
    p_device_type,
    p_user_agent,
    p_ip_address,
    p_referrer,
    now()
  )
  returning id into event_id;
  
  return event_id;
end;
$$;

-- Function to log WhatsApp contact events
create or replace function public.log_whatsapp_contact(
  p_product_id uuid,
  p_slot_id integer,
  p_language text default 'en',
  p_device_type text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  event_id uuid;
begin
  -- Log the WhatsApp contact event
  insert into public.analytics_events (
    event_type,
    product_id,
    slot_id,
    whatsapp_contact,
    language,
    device_type,
    created_at
  ) values (
    'whatsapp_contact',
    p_product_id,
    p_slot_id,
    true,
    p_language,
    p_device_type,
    now()
  )
  returning id into event_id;
  
  return event_id;
end;
$$;

--------------------------------------------------------------------------------
-- TRIGGERS
--------------------------------------------------------------------------------

-- Updated at triggers
create trigger set_updated_at_on_users
before update on public.users
for each row
execute function public.set_updated_at();

create trigger set_updated_at_on_products
before update on public.products
for each row
execute function public.set_updated_at();

create trigger set_updated_at_on_auction_slots
before update on public.auction_slots
for each row
execute function public.set_updated_at();

create trigger set_updated_at_on_delivery_options
before update on public.delivery_options
for each row
execute function public.set_updated_at();

create trigger set_updated_at_on_product_attributes
before update on public.product_attributes
for each row
execute function public.set_updated_at();

create trigger set_updated_at_on_promotional_banners
before update on public.promotional_banners
for each row
execute function public.set_updated_at();

--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY
--------------------------------------------------------------------------------

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.products enable row level security;
alter table public.auction_slots enable row level security;
alter table public.delivery_options enable row level security;
alter table public.product_attributes enable row level security;
alter table public.admin_users enable row level security;
alter table public.analytics_events enable row level security;
alter table public.promotional_banners enable row level security;

-- Users table policies
create policy "Anyone can view verified users" on public.users
for select
to anon, authenticated
using (is_verified = true);

create policy "Authenticated users can view all users" on public.users
for select
to authenticated
using (true);

create policy "Users can update their own information" on public.users
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Admin users can do everything with users" on public.users
for all
to authenticated
using ((select auth.uid()) in (select id from public.admin_users));

-- Products table policies
create policy "Anyone can view approved products" on public.products
for select
to anon, authenticated
using (status = 'approved');

create policy "Authenticated users can create their own products" on public.products
for insert
to authenticated
with check ((select auth.uid()) = seller_id);

create policy "Users can update their own products" on public.products
for update
to authenticated
using ((select auth.uid()) = seller_id)
with check ((select auth.uid()) = seller_id);

create policy "Users can delete their own products" on public.products
for delete
to authenticated
using ((select auth.uid()) = seller_id);

create policy "Admin users can do everything with products" on public.products
for all
to authenticated
using ((select auth.uid()) in (select id from public.admin_users));

-- Auction slots policies
create policy "Anyone can view auction slots" on public.auction_slots
for select
to anon, authenticated
using (true);

create policy "Admin users can manage auction slots" on public.auction_slots
for all
to authenticated
using ((select auth.uid()) in (select id from public.admin_users));

-- Delivery options policies
create policy "Anyone can view delivery options" on public.delivery_options
for select
to anon, authenticated
using (true);

create policy "Sellers can manage their product's delivery options" on public.delivery_options
for all
to authenticated
using ((select auth.uid()) = (select seller_id from public.products where id = delivery_options.product_id));

create policy "Admin users can manage all delivery options" on public.delivery_options
for all
to authenticated
using ((select auth.uid()) in (select id from public.admin_users));

-- Product attributes policies
create policy "Anyone can view product attributes" on public.product_attributes
for select
to anon, authenticated
using (true);

create policy "Sellers can manage their product's attributes" on public.product_attributes
for all
to authenticated
using ((select auth.uid()) = (select seller_id from public.products where id = product_attributes.product_id));

create policy "Admin users can manage all product attributes" on public.product_attributes
for all
to authenticated
using ((select auth.uid()) in (select id from public.admin_users));

-- Admin users policies
create policy "Admin users can view other admins" on public.admin_users
for select
to authenticated
using ((select auth.uid()) in (select id from public.admin_users));

create policy "Super admin can manage admin users" on public.admin_users
for all
to authenticated
using ((select auth.uid()) in (select id from public.admin_users where role = 'super_admin'));

-- Analytics events policies
create policy "Anyone can create analytics events" on public.analytics_events
for insert
to anon, authenticated
with check (true);

create policy "Admin users can view analytics" on public.analytics_events
for select
to authenticated
using ((select auth.uid()) in (select id from public.admin_users));

-- Promotional banners policies
create policy "Anyone can view active promotional banners" on public.promotional_banners
for select
to anon, authenticated
using (active = true and now() between start_date and end_date);

create policy "Admin users can manage promotional banners" on public.promotional_banners
for all
to authenticated
using ((select auth.uid()) in (select id from public.admin_users));

-- Drop existing policy to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage all images" ON storage.objects;

-- Create the fixed policy that avoids recursion
CREATE POLICY "Admins can manage all images"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'product-images' AND 
  auth.jwt() ->> 'email' IN ('sokoclick.com@gmail.com', 'pushns24@gmail.com')
);