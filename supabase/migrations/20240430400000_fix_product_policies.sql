-- Description: Fix product policies to avoid infinite recursion
-- Following cursor rules for SQL migrations

-- Step 1: Drop policies that might be causing recursion
drop policy if exists "Admin users can do everything with products" on public.products;

-- Step 2: Create simpler admin policy for products
create policy "Admins can manage products"
on public.products
for all
to authenticated
using (
  -- Use direct email check instead of referencing admin_users table
  auth.jwt() ->> 'email' in ('sokoclick.com@gmail.com', 'pushns24@gmail.com')
);

-- Step 3: Fix other policies referencing admin_users table
drop policy if exists "Admin users can manage all delivery options" on public.delivery_options;

create policy "Admins can manage delivery options"
on public.delivery_options
for all
to authenticated
using (
  auth.jwt() ->> 'email' in ('sokoclick.com@gmail.com', 'pushns24@gmail.com')
);

drop policy if exists "Admin users can manage all product attributes" on public.product_attributes;

create policy "Admins can manage product attributes"
on public.product_attributes
for all
to authenticated
using (
  auth.jwt() ->> 'email' in ('sokoclick.com@gmail.com', 'pushns24@gmail.com')
);

drop policy if exists "Admin users can manage auction slots" on public.auction_slots;

create policy "Admins can manage auction slots"
on public.auction_slots
for all
to authenticated
using (
  auth.jwt() ->> 'email' in ('sokoclick.com@gmail.com', 'pushns24@gmail.com')
);

-- Step 4: Fix categories policy as well
drop policy if exists "Admin users can manage categories" on public.categories;

create policy "Admins can manage categories"
on public.categories
for all
to authenticated
using (
  auth.jwt() ->> 'email' in ('sokoclick.com@gmail.com', 'pushns24@gmail.com')
); 