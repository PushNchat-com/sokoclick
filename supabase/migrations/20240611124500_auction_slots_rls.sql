-- Migration: Add Row Level Security (RLS) policies for auction_slots table
-- Description: This migration adds RLS policies to control who can view, create, update, and delete auction slots

-- First, enable RLS on the auction_slots table
alter table public.auction_slots enable row level security;

-- Give public access to read all active auction slots
create policy "Public can view active auction slots"
on public.auction_slots
for select
to anon, authenticated
using (
  is_active = true
);

-- Sellers can view their own auction slots
create policy "Sellers can view their own auction slots"
on public.auction_slots
for select
to authenticated
using (
  (select auth.uid()) = seller_id
);

-- Admins can view all auction slots
create policy "Admins can view all auction slots"
on public.auction_slots
for select
to authenticated
using (
  exists (
    select 1 from public.users
    where id = (select auth.uid())
    and role = 'admin'
  )
);

-- Only admins can create auction slots
create policy "Admins can create auction slots"
on public.auction_slots
for insert
to authenticated
with check (
  exists (
    select 1 from public.users
    where id = (select auth.uid())
    and role = 'admin'
  )
);

-- Admins can update any auction slot
create policy "Admins can update any auction slot"
on public.auction_slots
for update
to authenticated
using (
  exists (
    select 1 from public.users
    where id = (select auth.uid())
    and role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.users
    where id = (select auth.uid())
    and role = 'admin'
  )
);

-- Sellers can update their own auction slots
create policy "Sellers can update their own auction slots"
on public.auction_slots
for update
to authenticated
using (
  (select auth.uid()) = seller_id
)
with check (
  (select auth.uid()) = seller_id and
  -- Sellers cannot change critical fields
  coalesce(
    nullif(old.is_active, new.is_active),
    nullif(old.start_time, new.start_time),
    nullif(old.end_time, new.end_time),
    nullif(old.featured, new.featured)
  ) is null
);

-- Only admins can delete auction slots
create policy "Admins can delete auction slots"
on public.auction_slots
for delete
to authenticated
using (
  exists (
    select 1 from public.users
    where id = (select auth.uid())
    and role = 'admin'
  )
); 